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
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/linux-do/pay/internal/config"
	"github.com/redis/go-redis/extra/redisotel/v9"
	"github.com/redis/go-redis/v9"
	"github.com/redis/go-redis/v9/maintnotifications"
)

var (
	Redis *redis.Client
)

func init() {
	redisConfig := config.Config.Redis

	if !redisConfig.Enabled {
		log.Println("[Redis] is disabled, skipping Redis initialization")
		return
	}

	addr := fmt.Sprintf("%s:%d", redisConfig.Host, redisConfig.Port)

	Redis = redis.NewClient(
		&redis.Options{
			Addr:            addr,
			Username:        redisConfig.Username,
			Password:        redisConfig.Password,
			DB:              redisConfig.DB,
			PoolSize:        redisConfig.PoolSize,
			MinIdleConns:    redisConfig.MinIdleConn,
			DialTimeout:     time.Duration(redisConfig.DialTimeout) * time.Second,
			ReadTimeout:     time.Duration(redisConfig.ReadTimeout) * time.Second,
			WriteTimeout:    time.Duration(redisConfig.WriteTimeout) * time.Second,
			MaxRetries:      redisConfig.MaxRetries,
			PoolTimeout:     time.Duration(redisConfig.PoolTimeout) * time.Second,
			ConnMaxIdleTime: time.Duration(redisConfig.ConnMaxIdleTime) * time.Second,
			MaintNotificationsConfig: &maintnotifications.Config{
				Mode: maintnotifications.ModeDisabled,
			},
		},
	)

	// Trace
	if err := redisotel.InstrumentTracing(Redis); err != nil {
		log.Fatalf("[Redis] failed to init trace: %v\n", err)
	}

	// 测试连接
	_, err := Redis.Ping(context.Background()).Result()
	if err != nil {
		log.Fatalf("[Redis] failed to connect to redis: %v\n", err)
	}
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

	if err := Redis.HSet(ctx, hashKey, fieldKey, jsonData).Err(); err != nil {
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
	val, err := Redis.HGet(ctx, hashKey, fieldKey).Result()
	if err != nil {
		return err
	}

	if err := json.Unmarshal([]byte(val), data); err != nil {
		return fmt.Errorf("failed to unmarshal data: %w", err)
	}

	return nil
}
