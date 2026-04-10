/*
Copyright 2025 linux.do

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package storage

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/logger"
	"github.com/linux-do/credit/internal/otel_trace"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
	"golang.org/x/sync/singleflight"
)

var localCacheEnabled = false
var localCacheDir = ""
var cacheFilePath = "%s/%s"
var cacheMetaFilePath = "%s/%s.meta"
var group singleflight.Group
var cacheWriteSem = make(chan struct{}, 32)

type metaInfo struct {
	ContentType   string `json:"content_type"`
	ContentLength int64  `json:"content_length"`
}

type cacheObject struct {
	ObjectInfo
	Body []byte
}

func init() {
	cfg := config.Config.S3.LocalCache
	localCacheEnabled = cfg.Enabled && cfg.CacheDir != ""
	localCacheDir = strings.TrimSuffix(cfg.CacheDir, "/")
	if localCacheEnabled {
		if err := os.MkdirAll(cfg.CacheDir, 0755); err != nil {
			log.Fatalf("[Storage] failed to create local cache directory: %v\n", err)
		}
	}
}

func GetObjectViaCache(ctx context.Context, key string) (*ObjectInfo, error) {
	ctx, span := otel_trace.Start(ctx, "S3.GetObjectViaCache", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	var localPath, metaPath string

	// 检查本地缓存
	if localCacheEnabled {
		key = strings.TrimPrefix(key, "/")
		localPath = fmt.Sprintf(cacheFilePath, localCacheDir, key)
		metaPath = fmt.Sprintf(cacheMetaFilePath, localCacheDir, key)
		objInfo, err := GetLocalCacheFile(ctx, localPath, metaPath)
		if err != nil {
			return nil, err
		}
		if objInfo != nil {
			return objInfo, nil
		}
	}

	// 使用 singleflight 确保同一时间只有一个请求会触发 CDN 获取和本地缓存保存
	v, err, _ := group.Do(key, func() (interface{}, error) {
		// 没有缓存，通过 CDN 获取
		objInfo, err := GetObjectViaProxy(ctx, key)
		if err != nil {
			return nil, err
		}

		// 如果启用了本地缓存，异步保存到本地
		if localCacheEnabled {
			bodyBytes, err := io.ReadAll(objInfo.Body)
			if err != nil {
				span.SetStatus(codes.Error, err.Error())
				logger.ErrorF(ctx, "Failed to read object body for caching: %v", err)
				return objInfo, nil
			}
			_ = objInfo.Body.Close()
			objCopy := *objInfo
			objCopy.Body = io.NopCloser(bytes.NewReader(bodyBytes))
			objInfo.Body = io.NopCloser(bytes.NewReader(bodyBytes))
			// 使用非阻塞方式尝试获取信号量，如果成功则启动一个 goroutine 来保存缓存，否则记录警告日志，避免磁盘过载
			select {
			case cacheWriteSem <- struct{}{}:
				go func() {
					defer func() { <-cacheWriteSem }()
					SaveToLocalCache(context.WithoutCancel(ctx), localPath, metaPath, &objCopy)
				}()
			default:
				logger.WarnF(ctx, "Local cache is busy, skipping cache save for key: %s", key)
			}
		}

		// 将对象内容读入内存，以便在 singleflight 内部返回给其他等待的请求
		bodyBytes, err := io.ReadAll(objInfo.Body)
		if err != nil {
			span.SetStatus(codes.Error, err.Error())
			logger.ErrorF(ctx, "Failed to read object body: %v", err)
			return nil, err
		}
		return &cacheObject{ObjectInfo: ObjectInfo{ContentLength: objInfo.ContentLength, ContentType: objInfo.ContentType}, Body: bodyBytes}, nil
	})
	if err != nil {
		return nil, err
	}

	cacheObj := v.(*cacheObject)
	return &ObjectInfo{ContentLength: cacheObj.ContentLength, ContentType: cacheObj.ContentType, Body: io.NopCloser(bytes.NewReader(cacheObj.Body))}, nil
}

func GetLocalCacheFile(ctx context.Context, localPath, metaPath string) (*ObjectInfo, error) {
	ctx, span := otel_trace.Start(ctx, "S3.GetLocalCacheFile", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	// 尝试打开本地缓存文件
	file, err := os.Open(localPath)

	// 文件不存在
	if err != nil && os.IsNotExist(err) {
		return nil, nil
	}

	// 判断是否为其他异常
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to open local cache file %s: %v", localPath, err)
		return nil, LocalCacheError{}
	}

	// 读取元信息
	metaData, err := os.ReadFile(metaPath)

	// 文件不存在
	if err != nil && os.IsNotExist(err) {
		file.Close()
		return nil, nil
	}

	// 判断是否为其他异常
	if err != nil {
		file.Close()
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to read local cache meta file %s: %v", metaPath, err)
		return nil, LocalCacheError{}
	}

	// 解析元信息
	meta := &metaInfo{}
	if err := json.Unmarshal(metaData, meta); err != nil {
		file.Close()
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to parse local cache meta file %s: %v", metaPath, err)
		return nil, LocalCacheError{}
	}

	return &ObjectInfo{Body: file, ContentLength: meta.ContentLength, ContentType: meta.ContentType}, nil
}

func SaveToLocalCache(ctx context.Context, localPath, metaPath string, objInfo *ObjectInfo) {
	ctx, span := otel_trace.Start(ctx, "S3.SaveToLocalCache", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	// 创建目录
	localDir := filepath.Dir(localPath)
	if err := os.MkdirAll(localDir, 0755); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to create local cache directory %s: %v", localDir, err)
		return
	}

	// 创建临时文件
	tempFile, err := os.CreateTemp(localDir, "cache_temp_*")
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to create temp file for local cache: %v", err)
		return
	}
	defer os.Remove(tempFile.Name())

	// 将内容写入临时文件
	if _, err := tempFile.ReadFrom(objInfo.Body); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to write to temp file for local cache: %v", err)
		return
	}

	// 确保数据写入磁盘
	if err := tempFile.Sync(); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to sync temp file for local cache: %v", err)
		return
	}

	// 关闭临时文件
	if err := tempFile.Close(); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to close temp file for local cache: %v", err)
		return
	}

	// 写入元信息
	meta := &metaInfo{ContentType: objInfo.ContentType, ContentLength: objInfo.ContentLength}
	metaData, err := json.Marshal(meta)
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to marshal meta info for local cache: %v", err)
		return
	}

	// 创建临时元信息文件
	tempMetaFile, err := os.CreateTemp(localDir, "cache_meta_temp_*")
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to create temp meta file for local cache: %v", err)
		return
	}
	defer os.Remove(tempMetaFile.Name())

	// 将元信息写入临时文件
	if _, err := tempMetaFile.Write(metaData); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to write to temp meta file for local cache: %v", err)
		return
	}

	// 确保数据写入磁盘
	if err := tempMetaFile.Sync(); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to sync temp meta file for local cache: %v", err)
		return
	}

	// 关闭临时元信息文件
	if err := tempMetaFile.Close(); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to close temp meta file for local cache: %v", err)
		return
	}

	// 将临时文件重命名为最终文件
	if err := os.Rename(tempFile.Name(), localPath); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to rename temp file to local cache file %s: %v", localPath, err)
		return
	}

	// 将临时元信息文件重命名为最终元信息文件
	if err := os.Rename(tempMetaFile.Name(), metaPath); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to rename temp meta file to local cache meta file %s: %v", metaPath, err)
		return
	}
}
