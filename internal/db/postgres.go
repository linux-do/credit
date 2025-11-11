/*
 * MIT License
 *
 * Copyright (c) 2025 linux.do
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

package db

import (
	"context"
	"log"
	"net"
	"net/url"
	"strconv"
	"time"

	"github.com/linux-do/pay/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/plugin/opentelemetry/tracing"
)

var (
	db *gorm.DB
)

func init() {
	if !config.Config.Database.Enabled {
		log.Println("[PostgreSQL] is disabled, skipping initialization")
		return
	}

	var err error

	dbConfig := config.Config.Database
	pqURL := &url.URL{
		Scheme: "postgres",
		Host:   net.JoinHostPort(dbConfig.Host, strconv.Itoa(dbConfig.Port)),
		Path:   dbConfig.Database,
	}
	if dbConfig.Username != "" {
		pqURL.User = url.UserPassword(dbConfig.Username, dbConfig.Password)
	}

	query := pqURL.Query()
	sslMode := dbConfig.SSLMode
	if sslMode == "" {
		sslMode = "disable"
	}
	query.Set("sslmode", sslMode)
	if dbConfig.ApplicationName != "" {
		query.Set("application_name", dbConfig.ApplicationName)
	}
	if dbConfig.SearchPath != "" {
		query.Set("search_path", dbConfig.SearchPath)
	}
	if dbConfig.DefaultQueryExecMode != "" {
		query.Set("default_query_exec_mode", dbConfig.DefaultQueryExecMode)
	}
	if dbConfig.StatementCacheCapacity > 0 {
		query.Set("statement_cache_capacity", strconv.Itoa(dbConfig.StatementCacheCapacity))
	}

	// 先编码其他参数
	rawQuery := query.Encode()
	// TimeZone 不进行 URL 编码
	timeZone := dbConfig.TimeZone
	if timeZone != "" {
		if rawQuery != "" {
			rawQuery += "&"
		}
		rawQuery += "TimeZone=" + timeZone
	}
	pqURL.RawQuery = rawQuery

	pgConfig := postgres.Config{
		DSN: pqURL.String(),
	}

	pgConfig.PreferSimpleProtocol = dbConfig.PreferSimpleProtocol

	// 配置 GORM Logger
	gormLogger := logger.New(
		log.New(log.Writer(), "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             200 * time.Millisecond,
			LogLevel:                  logger.Warn,
			IgnoreRecordNotFoundError: config.Config.App.Env == "production",
			Colorful:                  config.Config.App.Env == "development",
		},
	)

	db, err = gorm.Open(postgres.New(pgConfig), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
		Logger:                                   gormLogger,
	})
	if err != nil {
		log.Fatalf("[PostgreSQL] init connection failed: %v\n", err)
	}

	// Trace 注入
	if err := db.Use(tracing.NewPlugin(tracing.WithoutMetrics())); err != nil {
		log.Fatalf("[PostgreSQL] init trace failed: %v\n", err)
	}

	// 获取通用数据库对象
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("[PostgreSQL] load sql db failed: %v\n", err)
	}

	// 设置连接池参数
	sqlDB.SetMaxIdleConns(dbConfig.MaxIdleConn)
	sqlDB.SetMaxOpenConns(dbConfig.MaxOpenConn)

	if dbConfig.ConnMaxLifetime > 0 {
		sqlDB.SetConnMaxLifetime(time.Duration(dbConfig.ConnMaxLifetime) * time.Second)
	}
	if dbConfig.ConnMaxIdleTime > 0 {
		sqlDB.SetConnMaxIdleTime(time.Duration(dbConfig.ConnMaxIdleTime) * time.Second)
	}
}

func DB(ctx context.Context) *gorm.DB {
	return db.WithContext(ctx)
}
