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

package dispute

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/hibiken/asynq"
	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/logger"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/service"
	"github.com/linux-do/credit/internal/task"
	"github.com/linux-do/credit/internal/task/scheduler"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// HandleAutoRefundExpiredDisputes 处理所有过期争议的批量任务
func HandleAutoRefundExpiredDisputes(ctx context.Context, t *asynq.Task) error {
	// 获取争议时间窗口配置（小时）
	disputeTimeHours, errGet := model.GetIntByKey(ctx, model.ConfigKeyDisputeTimeWindowHours)
	if errGet != nil {
		logger.ErrorF(ctx, "获取争议时间窗口配置失败: %v", errGet)
		return errGet
	}

	pageSize := 1000
	lastID := uint64(0)
	currentDelay := 0 * time.Second

	// 计算过期时间阈值：created_at < deadline 的争议需要自动退款
	deadline := time.Now().Add(-time.Duration(disputeTimeHours) * time.Hour)

	for {
		var disputes []model.Dispute
		if err := db.DB(ctx).
			Where("id > ? AND status = ? AND created_at < ?",
				lastID, model.DisputeStatusDisputing, deadline).
			Order("id ASC").
			Limit(pageSize).
			Find(&disputes).Error; err != nil {
			logger.ErrorF(ctx, "查询过期争议失败: %v", err)
			return err
		}

		// 没有更多争议，退出循环
		if len(disputes) == 0 {
			break
		}

		for _, dispute := range disputes {
			currentDelay += time.Duration(config.Config.Scheduler.DisputeAutoRefundDispatchIntervalSeconds) * time.Second

			payload, _ := json.Marshal(map[string]interface{}{
				"dispute_id": dispute.ID,
			})

			if _, errTask := scheduler.AsynqClient.Enqueue(
				asynq.NewTask(task.AutoRefundSingleDisputeTask, payload),
				asynq.ProcessIn(currentDelay),
				asynq.MaxRetry(5),
			); errTask != nil {
				logger.ErrorF(ctx, "下发争议[ID:%d]自动退款任务失败: %v", dispute.ID, errTask)
				return errTask
			} else {
				logger.InfoF(ctx, "下发争议[ID:%d]自动退款任务成功", dispute.ID)
			}
		}

		lastID = disputes[len(disputes)-1].ID
	}
	return nil
}

// HandleAutoRefundSingleDispute 处理单个争议的自动退款任务
func HandleAutoRefundSingleDispute(ctx context.Context, t *asynq.Task) error {
	// 解析任务参数
	var payload struct {
		DisputeID uint64 `json:"dispute_id"`
	}
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("解析任务参数失败: %w", err)
	}

	if err := db.DB(ctx).Transaction(func(tx *gorm.DB) error {
		var dispute model.Dispute
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "NOWAIT"}).
			Where("id = ? AND status = ?", payload.DisputeID, model.DisputeStatusDisputing).
			First(&dispute).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				logger.InfoF(ctx, "争议[ID:%d]已被处理或不存在，跳过", payload.DisputeID)
				return nil // 已处理，不算错误
			}
			return err
		}

		var order model.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "NOWAIT"}).
			Where(
				"id = ? AND status = ? AND type IN ?",
				dispute.OrderID,
				model.OrderStatusDisputing,
				[]model.OrderType{model.OrderTypePayment, model.OrderTypeOnline},
			).
			First(&order).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				logger.ErrorF(ctx, "争议[ID:%d]关联订单[ID:%d]不存在或状态异常", payload.DisputeID, dispute.OrderID)
				return nil // 订单状态异常，跳过
			}
			return err
		}

		// 获取收款方用户
		var payeeUser model.User
		if err := payeeUser.GetByID(tx, order.PayeeUserID); err != nil {
			return fmt.Errorf("查询收款方用户失败: %w", err)
		}

		// 获取商家的支付配置
		var merchantPayConfig model.UserPayConfig
		if err := merchantPayConfig.GetByPayScore(tx, payeeUser.PayScore); err != nil {
			return fmt.Errorf("查询商家支付配置失败: %w", err)
		}

		// 更新争议状态为已退款，handler_user_id 设为 0（系统自动处理）
		if err := tx.Model(&model.Dispute{}).
			Where("id = ?", dispute.ID).
			Updates(map[string]interface{}{
				"status":          model.DisputeStatusRefund,
				"handler_user_id": 0,
			}).Error; err != nil {
			return fmt.Errorf("更新争议状态失败: %w", err)
		}

		if err := service.RefundOrder(tx, &order, &merchantPayConfig); err != nil {
			return fmt.Errorf("订单退款失败: %w", err)
		}

		logger.InfoF(ctx, "自动退款成功: 争议[ID:%d] 订单[ID:%d] 金额[%s] 付款方[ID:%d] 商家[%s]",
			dispute.ID, order.ID, order.Amount.String(), order.PayerUserID, payeeUser.Username)

		return nil
	}); err != nil {
		logger.ErrorF(ctx, "处理争议[ID:%d]自动退款失败: %v", payload.DisputeID, err)
		return err
	}

	return nil
}
