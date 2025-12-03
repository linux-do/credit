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

package dispute

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/hibiken/asynq"
	"github.com/linux-do/pay/internal/config"
	"github.com/linux-do/pay/internal/db"
	"github.com/linux-do/pay/internal/logger"
	"github.com/linux-do/pay/internal/model"
	"github.com/linux-do/pay/internal/task"
	"github.com/linux-do/pay/internal/task/schedule"
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

	pageSize := 200
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
			currentDelay += time.Duration(config.Config.Schedule.DisputeAutoRefundDispatchIntervalSeconds) * time.Second

			payload, _ := json.Marshal(map[string]interface{}{
				"dispute_id": dispute.ID,
			})

			if _, errTask := schedule.AsynqClient.Enqueue(
				asynq.NewTask(task.AutoRefundSingleDisputeTask, payload),
				asynq.ProcessIn(currentDelay),
				asynq.MaxRetry(3),
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
			Where("id = ? AND status = ? AND type = ?", dispute.OrderID, model.OrderStatusDisputing, model.OrderTypePayment).
			First(&order).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				logger.ErrorF(ctx, "争议[ID:%d]关联订单[ID:%d]不存在或状态异常", payload.DisputeID, dispute.OrderID)
				return nil // 订单状态异常，跳过
			}
			return err
		}

		// 获取付款方和收款方用户
		var payerUser, payeeUser model.User
		if err := tx.Where("id = ?", order.PayerUserID).First(&payerUser).Error; err != nil {
			return fmt.Errorf("查询付款方用户失败: %w", err)
		}
		if err := tx.Where("id = ?", order.PayeeUserID).First(&payeeUser).Error; err != nil {
			return fmt.Errorf("查询收款方用户失败: %w", err)
		}

		// 获取商家的支付配置
		var merchantPayConfig model.UserPayConfig
		if err := merchantPayConfig.GetByPayScore(tx, payeeUser.PayScore); err != nil {
			return fmt.Errorf("查询商家支付配置失败: %w", err)
		}

		// 计算商家积分减少：订单金额 × 商家的 score_rate
		merchantScoreDecrease := order.Amount.Mul(merchantPayConfig.ScoreRate).Round(0).IntPart()

		// 商家(收款方)退款：扣除可用余额、总收款和积分
		if err := tx.Model(&model.User{}).
			Where("id = ?", payeeUser.ID).
			UpdateColumns(map[string]interface{}{
				"available_balance": gorm.Expr("available_balance - ?", order.Amount),
				"total_receive":     gorm.Expr("total_receive - ?", order.Amount),
				"pay_score":         gorm.Expr("pay_score - ?", merchantScoreDecrease),
			}).Error; err != nil {
			return fmt.Errorf("商家退款失败: %w", err)
		}

		// 付款方收到退款：增加可用余额，减少总支付和支付积分
		if err := tx.Model(&model.User{}).
			Where("id = ?", payerUser.ID).
			UpdateColumns(map[string]interface{}{
				"available_balance": gorm.Expr("available_balance + ?", order.Amount),
				"total_payment":     gorm.Expr("total_payment - ?", order.Amount),
				"pay_score":         gorm.Expr("pay_score - ?", order.Amount.Round(0).IntPart()),
			}).Error; err != nil {
			return fmt.Errorf("付款方退款失败: %w", err)
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

		// 更新订单状态为已退款
		if err := tx.Model(&model.Order{}).
			Where("id = ?", order.ID).
			UpdateColumn("status", model.OrderStatusRefund).Error; err != nil {
			return fmt.Errorf("更新订单状态失败: %w", err)
		}

		logger.InfoF(ctx, "自动退款成功: 争议[ID:%d] 订单[ID:%d] 金额[%s] 付款方[%s] 商家[%s]",
			dispute.ID, order.ID, order.Amount.String(), payerUser.Username, payeeUser.Username)

		return nil
	}); err != nil {
		logger.ErrorF(ctx, "处理争议[ID:%d]自动退款失败: %v", payload.DisputeID, err)
		return err
	}

	return nil
}
