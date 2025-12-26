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

package db

import (
	"context"
	"log"
	"net"
	"net/url"
	"strconv"
	"time"

	"github.com/linux-do/credit/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/plugin/dbresolver"
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

	// 构建主库 DSN 并连接
	primaryDSN := buildDSN(dbConfig.Host, dbConfig.Port, dbConfig.Username, dbConfig.Password)

	pgConfig := postgres.Config{
		DSN:                  primaryDSN,
		PreferSimpleProtocol: dbConfig.PreferSimpleProtocol,
	}

	// 配置 GORM Logger
	gormLogger := logger.New(
		log.New(log.Writer(), "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             200 * time.Millisecond,
			LogLevel:                  logger.Warn,
			IgnoreRecordNotFoundError: config.Config.App.IsProduction(),
			Colorful:                  !config.Config.App.IsProduction(),
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
	if err = db.Use(tracing.NewPlugin(tracing.WithoutMetrics())); err != nil {
		log.Fatalf("[PostgreSQL] init trace failed: %v\n", err)
	}

	if len(dbConfig.Replicas) > 0 {
		var replicaDialectors []gorm.Dialector
		for _, replica := range dbConfig.Replicas {
			username := replica.Username
			if username == "" {
				username = dbConfig.Username
			}
			password := replica.Password
			if password == "" {
				password = dbConfig.Password
			}
			replicaDSN := buildDSN(replica.Host, replica.Port, username, password)
			replicaDialectors = append(replicaDialectors, postgres.New(postgres.Config{
				DSN:                  replicaDSN,
				PreferSimpleProtocol: dbConfig.PreferSimpleProtocol,
			}))
		}

		resolver := dbresolver.Register(dbresolver.Config{
			Replicas: replicaDialectors,
			Policy:   dbresolver.RandomPolicy{},
		})

		resolver.SetMaxIdleConns(dbConfig.MaxIdleConn).
			SetMaxOpenConns(dbConfig.MaxOpenConn).
			SetConnMaxLifetime(time.Duration(dbConfig.ConnMaxLifetime) * time.Second).
			SetConnMaxIdleTime(time.Duration(dbConfig.ConnMaxIdleTime) * time.Second)

		if err = db.Use(resolver); err != nil {
			log.Fatalf("[PostgreSQL] init dbresolver failed: %v\n", err)
		}
		log.Printf("[PostgreSQL] initialized in Primary-Replica mode (%d replicas)\n", len(dbConfig.Replicas))
	} else {
		log.Println("[PostgreSQL] initialized in Standalone mode")
	}

	// 获取通用数据库对象设置连接池
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("[PostgreSQL] load sql db failed: %v\n", err)
	}

	sqlDB.SetMaxIdleConns(dbConfig.MaxIdleConn)
	sqlDB.SetMaxOpenConns(dbConfig.MaxOpenConn)
	sqlDB.SetConnMaxLifetime(time.Duration(dbConfig.ConnMaxLifetime) * time.Second)
	sqlDB.SetConnMaxIdleTime(time.Duration(dbConfig.ConnMaxIdleTime) * time.Second)

}

// buildDSN 构建 PostgreSQL DSN
func buildDSN(host string, port int, username, password string) string {
	cfg := config.Config.Database
	pqURL := &url.URL{
		Scheme: "postgres",
		Host:   net.JoinHostPort(host, strconv.Itoa(port)),
		Path:   cfg.Database,
	}
	if username != "" {
		pqURL.User = url.UserPassword(username, password)
	}

	query := pqURL.Query()
	sslMode := cfg.SSLMode
	if sslMode == "" {
		sslMode = "disable"
	}
	query.Set("sslmode", sslMode)
	if cfg.ApplicationName != "" {
		query.Set("application_name", cfg.ApplicationName)
	}
	if cfg.SearchPath != "" {
		query.Set("search_path", cfg.SearchPath)
	}
	if cfg.DefaultQueryExecMode != "" {
		query.Set("default_query_exec_mode", cfg.DefaultQueryExecMode)
	}
	if cfg.StatementCacheCapacity > 0 {
		query.Set("statement_cache_capacity", strconv.Itoa(cfg.StatementCacheCapacity))
	}

	rawQuery := query.Encode()
	if cfg.TimeZone != "" {
		if rawQuery != "" {
			rawQuery += "&"
		}
		rawQuery += "TimeZone=" + cfg.TimeZone
	}
	pqURL.RawQuery = rawQuery

	return pqURL.String()
}

func DB(ctx context.Context) *gorm.DB {
	return db.WithContext(ctx)
}
