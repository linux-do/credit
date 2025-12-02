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

package migrator

import (
	"context"
	"log"

	"github.com/linux-do/pay/internal/model"

	"github.com/linux-do/pay/internal/config"
	"github.com/linux-do/pay/internal/db"
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
			Level:      model.PayLevelFree,
			MinScore:   0,
			MaxScore:   int64Ptr(2000),
			DailyLimit: int64Ptr(1000),
			FeeRate:    decimal.Zero,
			ScoreRate:  decimal.Zero,
		},
		{
			Level:      model.PayLevelBasic,
			MinScore:   2000,
			MaxScore:   int64Ptr(10000),
			DailyLimit: int64Ptr(6000),
			FeeRate:    decimal.Zero,
			ScoreRate:  decimal.Zero,
		},
		{
			Level:      model.PayLevelStandard,
			MinScore:   10000,
			MaxScore:   int64Ptr(50000),
			DailyLimit: int64Ptr(25000),
			FeeRate:    decimal.Zero,
			ScoreRate:  decimal.Zero,
		},
		{
			Level:      model.PayLevelPremium,
			MinScore:   50000,
			MaxScore:   nil,
			DailyLimit: nil,
			FeeRate:    decimal.Zero,
			ScoreRate:  decimal.Zero,
		},
	}

	if err := tx.Create(&defaultConfigs).Error; err != nil {
		log.Printf("[PostgreSQL] failed to create default user pay configs: %v\n", err)
	} else {
		log.Printf("[PostgreSQL] initialized %d default user pay configs\n", len(defaultConfigs))
	}
}
