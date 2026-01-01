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

package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/hibiken/asynq"
	"github.com/linux-do/credit/internal/common"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/task"
	"github.com/linux-do/credit/internal/task/scheduler"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// BalanceOperation 余额操作类型
type BalanceOperation int

const (
	BalanceAdd BalanceOperation = iota
	BalanceDeduct
)

// BalanceUpdateOptions 余额更新选项
type BalanceUpdateOptions struct {
	UserID       uint64
	Amount       decimal.Decimal
	Operation    BalanceOperation
	ScoreChange  int64
	TotalField   string // 累计字段：total_payment / total_receive / total_transfer
	CheckBalance bool
}

// UpdateBalance 通用余额更新函数
func UpdateBalance(tx *gorm.DB, opts BalanceUpdateOptions) error {
	updates := make(map[string]interface{})

	if opts.Operation == BalanceAdd {
		updates["available_balance"] = gorm.Expr("available_balance + ?", opts.Amount)
	} else {
		updates["available_balance"] = gorm.Expr("available_balance - ?", opts.Amount)
	}

	if opts.TotalField != "" {
		updates[opts.TotalField] = gorm.Expr(opts.TotalField+" + ?", opts.Amount)
	}

	if opts.ScoreChange != 0 {
		updates["pay_score"] = gorm.Expr("pay_score + ?", opts.ScoreChange)
	}

	query := tx.Model(&model.User{}).Where("id = ?", opts.UserID)
	if opts.CheckBalance {
		query = query.Where("available_balance >= ?", opts.Amount)
	}

	result := query.UpdateColumns(updates)
	if result.Error != nil {
		return result.Error
	}
	if opts.CheckBalance && result.RowsAffected == 0 {
		return errors.New(common.InsufficientBalance)
	}

	return nil
}

// CheckDailyLimit 检查用户每日支付限额
// 返回 nil 表示未超限额，返回 error 表示超限或查询失败
func CheckDailyLimit(tx *gorm.DB, userID uint64, amount decimal.Decimal, dailyLimit *int64) error {
	if dailyLimit == nil || *dailyLimit <= 0 {
		return nil
	}

	now := time.Now()
	datePart := int64(now.Year()*10000 + int(now.Month())*100 + now.Day())
	lockID := int64(userID)*100000000 + datePart
	if err := tx.Exec("SELECT pg_advisory_xact_lock(?)", lockID).Error; err != nil {
		return err
	}

	todayUsed, err := GetTodayUsedAmount(tx, userID)
	if err != nil {
		return err
	}

	if todayUsed.Add(amount).GreaterThan(decimal.NewFromInt(*dailyLimit)) {
		return errors.New(common.DailyLimitExceeded)
	}

	return nil
}

// GetTodayUsedAmount 获取用户当日已使用的支付额度
func GetTodayUsedAmount(db *gorm.DB, userID uint64) (decimal.Decimal, error) {
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	todayEnd := todayStart.Add(24 * time.Hour)

	var total decimal.Decimal
	err := db.Model(&model.Order{}).
		Where("payer_user_id = ? AND status = ? AND type IN ? AND trade_time >= ? AND trade_time < ?",
			userID,
			model.OrderStatusSuccess,
			[]model.OrderType{model.OrderTypePayment, model.OrderTypeOnline},
			todayStart,
			todayEnd).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&total).Error

	return total, err
}

// CalculateFee 计算手续费和商户实收金额
// 返回：手续费、商户实收金额、手续费百分比
func CalculateFee(amount decimal.Decimal, feeRate decimal.Decimal) (fee decimal.Decimal, merchantAmount decimal.Decimal, feePercent int64) {
	fee = amount.Mul(feeRate).Round(2)
	merchantAmount = amount.Sub(fee)
	feePercent = feeRate.Mul(decimal.NewFromInt(100)).IntPart()
	return
}

// ValidateTestModePayment 验证测试模式下的支付权限
// 返回 error：nil 表示允许支付，非 nil 表示拒绝支付
func ValidateTestModePayment(currentUserID, merchantUserID uint64, isTestMode bool) error {
	if currentUserID == merchantUserID {
		if !isTestMode {
			return errors.New(common.CannotPaySelf)
		}
	} else if isTestMode {
		return errors.New(common.TestModeCannotProcessOrder)
	}
	return nil
}

// EnqueueMerchantNotify 下发商户回调任务
func EnqueueMerchantNotify(orderID uint64, clientID string) error {
	notifyPayload, _ := json.Marshal(map[string]interface{}{
		"order_id":  orderID,
		"client_id": clientID,
	})
	if _, err := scheduler.AsynqClient.Enqueue(
		asynq.NewTask(task.MerchantPaymentNotifyTask, notifyPayload),
		asynq.Queue(task.QueueWebhook),
		asynq.MaxRetry(10),
		asynq.Timeout(30*time.Second),
	); err != nil {
		return fmt.Errorf("下发商户回调任务失败: %w", err)
	}
	return nil
}
