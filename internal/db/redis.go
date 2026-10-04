/*
Copyright 2025-2026 linux.do

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
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/linux-do/credit/internal/config"
	"github.com/redis/go-redis/extra/redisotel/v9"
	"github.com/redis/go-redis/v9"
	"go.opentelemetry.io/otel/attribute"
)

var (
	Redis redis.UniversalClient
)

func init() {
	cfg := config.Config.Redis

	if !cfg.Enabled {
		log.Println("[Redis] is disabled, skipping Redis initialization")
		return
	}

	if cfg.ClusterMode {
		// Cluster 模式
		Redis = redis.NewClusterClient(&redis.ClusterOptions{
			Addrs:           cfg.Addrs,
			Username:        cfg.Username,
			Password:        cfg.Password,
			PoolSize:        cfg.PoolSize,
			MinIdleConns:    cfg.MinIdleConn,
			DialTimeout:     time.Duration(cfg.DialTimeout) * time.Second,
			ReadTimeout:     time.Duration(cfg.ReadTimeout) * time.Second,
			WriteTimeout:    time.Duration(cfg.WriteTimeout) * time.Second,
			MaxRetries:      cfg.MaxRetries,
			PoolTimeout:     time.Duration(cfg.PoolTimeout) * time.Second,
			ConnMaxIdleTime: time.Duration(cfg.ConnMaxIdleTime) * time.Second,
		})
		log.Println("[Redis] initialized in Cluster mode")
	} else {
		// Standalone 或 Sentinel 模式
		Redis = redis.NewUniversalClient(&redis.UniversalOptions{
			Addrs:           cfg.Addrs,
			MasterName:      cfg.MasterName, // 非空时启用 Sentinel
			Username:        cfg.Username,
			Password:        cfg.Password,
			DB:              cfg.DB,
			PoolSize:        cfg.PoolSize,
			MinIdleConns:    cfg.MinIdleConn,
			DialTimeout:     time.Duration(cfg.DialTimeout) * time.Second,
			ReadTimeout:     time.Duration(cfg.ReadTimeout) * time.Second,
			WriteTimeout:    time.Duration(cfg.WriteTimeout) * time.Second,
			MaxRetries:      cfg.MaxRetries,
			PoolTimeout:     time.Duration(cfg.PoolTimeout) * time.Second,
			ConnMaxIdleTime: time.Duration(cfg.ConnMaxIdleTime) * time.Second,
		})
		if cfg.MasterName != "" {
			log.Println("[Redis] initialized in Sentinel mode")
		} else {
			log.Println("[Redis] initialized in Standalone mode")
		}
	}

	// OpenTelemetry 追踪（UniversalClient 兼容）
	if err := redisotel.InstrumentTracing(
		Redis,
		redisotel.WithAttributes(
			attribute.String("db.instance", fmt.Sprintf("%v", cfg.DB)),
			attribute.String("db.ip", strings.Join(cfg.Addrs, ",")),
			attribute.String("db.system", "Redis"),
		),
	); err != nil {
		log.Fatalf("[Redis] failed to init trace: %v\n", err)
	}

	// 测试连接
	_, err := Redis.Ping(context.Background()).Result()
	if err != nil {
		log.Fatalf("[Redis] failed to connect to redis: %v\n", err)
	}
}

// PrefixedKey 返回带前缀的 Key
func PrefixedKey(key string) string {
	prefix := config.Config.Redis.KeyPrefix
	if prefix == "" {
		return key
	}
	return prefix + key
}

// HSetJSON 将泛型数据序列化为 JSON 并设置到 Redis Hash
// ctx: 上下文
// hashKey: Redis Hash key
// fieldKey: Hash field key
// data: 要存储的数据（泛型）
func HSetJSON[T any](ctx context.Context, hashKey, fieldKey string, data T) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	if err := Redis.HSet(ctx, PrefixedKey(hashKey), fieldKey, jsonData).Err(); err != nil {
		return fmt.Errorf("failed to set redis hash: %w", err)
	}

	return nil
}

// HGetJSON 从 Redis Hash 获取数据并反序列化为泛型类型
// ctx: 上下文
// hashKey: Redis Hash key
// fieldKey: Hash field key
// data: 用于接收数据的指针（泛型）
func HGetJSON[T any](ctx context.Context, hashKey, fieldKey string, data *T) error {
	val, err := Redis.HGet(ctx, PrefixedKey(hashKey), fieldKey).Result()
	if err != nil {
		return err
	}

	if err := json.Unmarshal([]byte(val), data); err != nil {
		return fmt.Errorf("failed to unmarshal data: %w", err)
	}

	return nil
}

// GetJSON 从Redis获取数据并反序列化为泛型类型
// ctx: 上下文
// client: Redis客户端或事务客户端
// key: Redis key
// data: 用于接收数据的指针（泛型）
func GetJSON[T any](ctx context.Context, client redis.Cmdable, key string, data *T) error {
	val, err := client.Get(ctx, PrefixedKey(key)).Bytes()
	if err != nil {
		return err
	}

	if err := json.Unmarshal(val, data); err != nil {
		return fmt.Errorf("failed to unmarshal data: %w", err)
	}

	return nil
}

// SetJSON 将泛型数据序列化为JSON并设置到Redis
// ctx: 上下文
// client: Redis客户端或事务管道
// key: Redis key
// data: 要存储的数据（泛型）
// expiration: 过期时间
func SetJSON[T any](ctx context.Context, client redis.Cmdable, key string, data T, expiration time.Duration) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	if err := client.Set(ctx, PrefixedKey(key), jsonData, expiration).Err(); err != nil {
		return fmt.Errorf("failed to set redis key: %w", err)
	}

	return nil
}

// UpdateJSON 通过事务原子读取并更新Redis中的JSON数据
// ctx: 上下文
// key: Redis key
// update: 更新回调，接收数据指针（key不存在时为零值），返回过期时间、是否写入和错误
// expiration: 过期时间，0表示不过期，负数表示删除key
// write: 是否写入，false表示保持原值和过期时间不变
// err: 回调返回错误时取消更新，并发修改导致事务冲突时返回redis.TxFailedErr
func UpdateJSON[T any](ctx context.Context, key string, update func(*T) (expiration time.Duration, write bool, err error)) error {
	return Redis.Watch(ctx, func(tx *redis.Tx) error {
		var data T
		if err := GetJSON(ctx, tx, key, &data); err != nil && !errors.Is(err, redis.Nil) {
			return err
		}
		expiration, write, err := update(&data)
		if err != nil || !write {
			return err
		}
		_, err = tx.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
			if expiration < 0 {
				pipe.Del(ctx, PrefixedKey(key))
				return nil
			}
			return SetJSON(ctx, pipe, key, data, expiration)
		})
		return err
	}, PrefixedKey(key))
}
