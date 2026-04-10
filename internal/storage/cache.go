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
	"context"
	"encoding/json"
	"fmt"
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

type metaInfo struct {
	ContentType   string `json:"content_type"`
	ContentLength int64  `json:"content_length"`
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
	// 没有开启本地缓存
	if !localCacheEnabled {
		return GetObjectViaProxy(ctx, key)
	}

	// 初始化 Trace
	ctx, span := otel_trace.Start(ctx, "S3.GetObjectViaCache", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	// 检查本地缓存
	key = strings.TrimPrefix(key, "/")
	localPath := fmt.Sprintf(cacheFilePath, localCacheDir, key)
	metaPath := fmt.Sprintf(cacheMetaFilePath, localCacheDir, key)
	objInfo, err := GetLocalCacheFile(ctx, localPath, metaPath)
	if err != nil {
		return nil, err
	}
	if objInfo != nil {
		return objInfo, nil
	}

	// 使用 singleflight 确保同一时间只有一个请求会触发 CDN 获取和本地缓存保存
	_, err, _ = group.Do(key, func() (interface{}, error) {
		ctx := context.WithoutCancel(ctx)

		// 没有缓存，通过 CDN 获取
		objInfo, err := GetObjectViaProxy(ctx, key)
		if err != nil {
			return nil, err
		}

		// 保存到本地
		if err := SaveToLocalCache(ctx, localPath, metaPath, objInfo); err != nil {
			return nil, err
		}

		return nil, nil
	})
	if err != nil {
		logger.ErrorF(ctx, "Failed to get object via singleflight for key %s: %v", key, err)
		return nil, LocalCacheError{}
	}

	return GetObjectViaCache(ctx, key)
}

func GetLocalCacheFile(ctx context.Context, localPath, metaPath string) (*ObjectInfo, error) {
	ctx, span := otel_trace.Start(ctx, "S3.GetLocalCacheFile", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	// 尝试打开本地缓存文件
	file, err := os.Open(localPath)
	defer file.Close()

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
		return nil, nil
	}

	// 判断是否为其他异常
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to read local cache meta file %s: %v", metaPath, err)
		return nil, LocalCacheError{}
	}

	// 解析元信息
	meta := &metaInfo{}
	if err := json.Unmarshal(metaData, meta); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to parse local cache meta file %s: %v", metaPath, err)
		return nil, LocalCacheError{}
	}

	return &ObjectInfo{CachePath: localPath, ContentLength: meta.ContentLength, ContentType: meta.ContentType}, nil
}

func SaveToLocalCache(ctx context.Context, localPath, metaPath string, objInfo *ObjectInfo) error {
	ctx, span := otel_trace.Start(ctx, "S3.SaveToLocalCache", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	// 创建目录
	localDir := filepath.Dir(localPath)
	if err := os.MkdirAll(localDir, 0755); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to create local cache directory %s: %v", localDir, err)
		return err
	}

	// 创建临时文件
	tempFile, err := os.CreateTemp(localDir, "cache_temp_*")
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to create temp file for local cache: %v", err)
		return err
	}
	defer os.Remove(tempFile.Name())

	// 将内容写入临时文件
	if _, err := tempFile.ReadFrom(objInfo.Body); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to write to temp file for local cache: %v", err)
		return err
	}

	// 确保数据写入磁盘
	if err := tempFile.Sync(); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to sync temp file for local cache: %v", err)
		return err
	}

	// 关闭临时文件
	if err := tempFile.Close(); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to close temp file for local cache: %v", err)
		return err
	}

	// 写入元信息
	meta := &metaInfo{ContentType: objInfo.ContentType, ContentLength: objInfo.ContentLength}
	metaData, err := json.Marshal(meta)
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to marshal meta info for local cache: %v", err)
		return err
	}

	// 创建临时元信息文件
	tempMetaFile, err := os.CreateTemp(localDir, "cache_meta_temp_*")
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to create temp meta file for local cache: %v", err)
		return err
	}
	defer os.Remove(tempMetaFile.Name())

	// 将元信息写入临时文件
	if _, err := tempMetaFile.Write(metaData); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to write to temp meta file for local cache: %v", err)
		return err
	}

	// 确保数据写入磁盘
	if err := tempMetaFile.Sync(); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to sync temp meta file for local cache: %v", err)
		return err
	}

	// 关闭临时元信息文件
	if err := tempMetaFile.Close(); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to close temp meta file for local cache: %v", err)
		return err
	}

	// 将临时文件重命名为最终文件
	if err := os.Rename(tempFile.Name(), localPath); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to rename temp file to local cache file %s: %v", localPath, err)
		return err
	}

	// 将临时元信息文件重命名为最终元信息文件
	if err := os.Rename(tempMetaFile.Name(), metaPath); err != nil {
		span.SetStatus(codes.Error, err.Error())
		logger.ErrorF(ctx, "Failed to rename temp meta file to local cache meta file %s: %v", metaPath, err)
		return err
	}

	return nil
}
