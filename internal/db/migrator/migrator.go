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

package migrator

import (
	"context"
	"log"

	"github.com/linux-do/credit/internal/model"

	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/db"
	"github.com/shopspring/decimal"
)

func Migrate() {
	if !config.Config.Database.Enabled {
		return
	}

	if err := db.DB(context.Background()).AutoMigrate(
		&model.User{},
		&model.UserPayConfig{},
		&model.MerchantAPIKey{},
		&model.MerchantPaymentLink{},
		&model.Order{},
		&model.SystemConfig{},
		&model.Dispute{},
	); err != nil {
		log.Fatalf("[PostgreSQL] auto migrate failed: %v\n", err)
	}
	log.Printf("[PostgreSQL] auto migrate success\n")

	// 初始化系统配置数据
	initSystemConfigs()

	// 初始化用户支付配置数据
	initUserPayConfigs()
}

// initSystemConfigs 初始化系统配置数据
func initSystemConfigs() {
	tx := db.DB(context.Background())

	var count int64
	if err := tx.Model(&model.SystemConfig{}).Count(&count).Error; err != nil {
		log.Printf("[PostgreSQL] failed to check system_config table: %v\n", err)
		return
	}

	if count > 0 {
		return
	}

	defaultConfigs := []model.SystemConfig{
		{
			Key:         model.ConfigKeyMerchantOrderExpireMinutes,
			Value:       "5",
			Description: "商家订单过期时间（分钟）",
		},
		{
			Key:         model.ConfigKeyWebsiteOrderExpireMinutes,
			Value:       "10",
			Description: "网站订单过期时间（分钟）",
		},
		{
			Key:         model.ConfigKeyDisputeTimeWindowHours,
			Value:       "168",
			Description: "商家争议时间窗口（小时）",
		},
		{
			Key:         model.ConfigKeyNewUserInitialCredit,
			Value:       "0",
			Description: "新用户注册初始积分",
		},
		{
			Key:         model.ConfigKeyNewUserProtectionDays,
			Value:       "30",
			Description: "新用户保护期天数，期内积分下降不扣分",
		},
		{
			Key:         model.ConfigKeyLeaderboardCacheTTLSeconds,
			Value:       "30",
			Description: "排行榜缓存过期时间（秒）",
		},
	}

	if err := tx.Create(&defaultConfigs).Error; err != nil {
		log.Printf("[PostgreSQL] failed to create default system configs: %v\n", err)
	} else {
		log.Printf("[PostgreSQL] initialized %d default system configs\n", len(defaultConfigs))
	}
}

// int64Ptr 返回 int64 指针
func int64Ptr(v int64) *int64 {
	return &v
}

// initUserPayConfigs 初始化用户支付配置数据
func initUserPayConfigs() {
	tx := db.DB(context.Background())

	var count int64
	if err := tx.Model(&model.UserPayConfig{}).Count(&count).Error; err != nil {
		log.Printf("[PostgreSQL] failed to check user_pay_configs table: %v\n", err)
		return
	}

	if count > 0 {
		return
	}

	defaultConfigs := []model.UserPayConfig{
		{
			Level:          model.PayLevelFree,
			MinScore:       0,
			MaxScore:       int64Ptr(2000),
			DailyLimit:     int64Ptr(1000),
			FeeRate:        decimal.Zero,
			ScoreRate:      decimal.Zero,
			DistributeRate: decimal.Zero,
		},
		{
			Level:          model.PayLevelBasic,
			MinScore:       2000,
			MaxScore:       int64Ptr(10000),
			DailyLimit:     int64Ptr(6000),
			FeeRate:        decimal.Zero,
			ScoreRate:      decimal.Zero,
			DistributeRate: decimal.Zero,
		},
		{
			Level:          model.PayLevelStandard,
			MinScore:       10000,
			MaxScore:       int64Ptr(50000),
			DailyLimit:     int64Ptr(25000),
			FeeRate:        decimal.Zero,
			ScoreRate:      decimal.Zero,
			DistributeRate: decimal.Zero,
		},
		{
			Level:          model.PayLevelPremium,
			MinScore:       50000,
			MaxScore:       nil,
			DailyLimit:     nil,
			FeeRate:        decimal.Zero,
			ScoreRate:      decimal.Zero,
			DistributeRate: decimal.Zero,
		},
	}

	if err := tx.Create(&defaultConfigs).Error; err != nil {
		log.Printf("[PostgreSQL] failed to create default user pay configs: %v\n", err)
	} else {
		log.Printf("[PostgreSQL] initialized %d default user pay configs\n", len(defaultConfigs))
	}
}
