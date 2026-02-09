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

package router

import (
	"io"
	"net/http"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/logger"
	"github.com/linux-do/credit/internal/otel_trace"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

func loggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 初始化 Trace
		ctx, span := otel_trace.Start(c.Request.Context(), "LoggerMiddleware")
		defer span.End()

		// 开始计时
		start := time.Now()

		// 记录请求路径和 Query
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery
		if raw != "" {
			path = path + "?" + raw
		}

		// 执行请求
		c.Next()

		// 停止计时
		end := time.Now()
		latency := end.Sub(start)

		// 打印日志
		logger.InfoF(
			ctx,
			"[LoggerMiddleware] %s %s\nStartTime: %s\nEndTime: %s\nLatency: %d\nClientIP: %s\nResponse: %d %d",
			c.Request.Method,
			path,
			start.Format(time.RFC3339),
			end.Format(time.RFC3339),
			latency.Milliseconds(),
			c.ClientIP(),
			c.Writer.Status(),
			c.Writer.Size(),
		)

		// 设置 Span 状态
		if c.Writer.Status() >= 400 {
			span := trace.SpanFromContext(ctx)
			span.SetStatus(codes.Error, strconv.Itoa(c.Writer.Status()))
		}
	}
}

func uploadsStaticHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		relPath := strings.TrimPrefix(c.Param("filepath"), "/")
		if relPath == "" {
			c.AbortWithStatus(http.StatusForbidden)
			return
		}

		cleanRelPath := path.Clean(relPath)
		if cleanRelPath == "." || strings.HasPrefix(cleanRelPath, "..") {
			c.AbortWithStatus(http.StatusForbidden)
			return
		}

		fs := http.Dir("uploads")
		file, err := fs.Open(cleanRelPath)
		if err != nil {
			c.AbortWithStatus(http.StatusForbidden)
			return
		}
		defer file.Close()

		info, err := file.Stat()
		if err != nil || info.IsDir() {
			c.AbortWithStatus(http.StatusForbidden)
			return
		}

		reader, ok := file.(io.ReadSeeker)
		if !ok {
			c.AbortWithStatus(http.StatusForbidden)
			return
		}

		http.ServeContent(c.Writer, c.Request, info.Name(), info.ModTime(), reader)
	}
}
