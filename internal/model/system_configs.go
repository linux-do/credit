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

package model

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/shopspring/decimal"

	"github.com/linux-do/credit/internal/db"
)

// 配置键常量 - 所有系统配置的 key 定义
const (
	ConfigKeyMerchantOrderExpireMinutes = "merchant_order_expire_minutes" // 商家订单过期时间（分钟）
	ConfigKeyWebsiteOrderExpireMinutes  = "website_order_expire_minutes"  // 网站订单过期时间（分钟）
	ConfigKeyDisputeTimeWindowHours     = "dispute_time_window_hours"     // 商家争议时间窗口（小时）
	ConfigKeyNewUserInitialCredit       = "new_user_initial_credit"       // 新用户注册初始积分
	ConfigKeyNewUserProtectionDays      = "new_user_protection_days"      // 新用户保护期天数（期内不扣分）
	ConfigKeyRedEnvelopeEnabled         = "red_envelope_enabled"          // 红包功能是否启用（1启用，0禁用）
	ConfigKeyRedEnvelopeMaxAmount       = "red_envelope_max_amount"       // 单个红包的最大积分上限
	ConfigKeyRedEnvelopeDailyLimit      = "red_envelope_daily_limit"      // 每日发红包的个数限制
	ConfigKeyRedEnvelopeFeeRate         = "red_envelope_fee_rate"         // 红包手续费率（0-1之间的小数，0表示不收费）
)

const (
	// SystemConfigRedisHashKey Redis Hash key，存储所有系统配置
	SystemConfigRedisHashKey = "system:system_configs"
)

type SystemConfig struct {
	Key         string    `json:"key" gorm:"primaryKey;size:64;not null"`
	Value       string    `json:"value" gorm:"size:255;not null"`
	Description string    `json:"description" gorm:"size:255"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
}

// GetByKey 通过 key 查询配置（带 Redis 缓存）
func (sc *SystemConfig) GetByKey(ctx context.Context, key string) error {
	if err := db.HGetJSON(ctx, SystemConfigRedisHashKey, key, sc); err == nil {
		return nil
	} else if !errors.Is(err, redis.Nil) {
		// Redis 服务错误，返回错误
		return err
	}

	// 查数据库
	if err := db.DB(ctx).Where("key = ?", key).First(sc).Error; err != nil {
		return err
	}

	// 更新 Redis Hash 缓存
	_ = db.HSetJSON(ctx, SystemConfigRedisHashKey, key, sc)

	return nil
}

// GetIntByKey 通过 key 查询配置并转换为 int 类型
func GetIntByKey(ctx context.Context, key string) (int, error) {
	var sc SystemConfig
	if err := sc.GetByKey(ctx, key); err != nil {
		return 0, err
	}

	value, err := strconv.Atoi(sc.Value)
	if err != nil {
		return 0, fmt.Errorf("配置 %s 的值 '%s' 无法转换为整数: %w", key, sc.Value, err)
	}

	return value, nil
}

// GetDecimalByKey 通过 key 查询配置并转换为 decimal.Decimal 类型
// precision 指定保留的小数位数，多余的小数会被裁剪
func GetDecimalByKey(ctx context.Context, key string, precision int32) (decimal.Decimal, error) {
	var sc SystemConfig
	if err := sc.GetByKey(ctx, key); err != nil {
		return decimal.Zero, err
	}

	value, err := decimal.NewFromString(sc.Value)
	if err != nil {
		return decimal.Zero, fmt.Errorf("配置 %s 的值 '%s' 无法转换为decimal: %w", key, sc.Value, err)
	}

	// 裁剪到指定小数位数
	return value.Truncate(precision), nil
}
