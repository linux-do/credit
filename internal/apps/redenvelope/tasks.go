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

package redenvelope

import (
	"context"
	"fmt"
	"time"

	"github.com/hibiken/asynq"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/logger"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/service"
	"gorm.io/gorm"
)

// HandleRefundExpiredRedEnvelopes 处理过期红包退款的定时任务
func HandleRefundExpiredRedEnvelopes(ctx context.Context, t *asynq.Task) error {
	logger.InfoF(ctx, "开始处理过期红包退款任务")
	refundExpiredRedEnvelopes(ctx)
	logger.InfoF(ctx, "过期红包退款任务完成")
	return nil
}

// refundExpiredRedEnvelopes 退款过期红包
func refundExpiredRedEnvelopes(ctx context.Context) {
	const batchSize = 100 // 每批处理100个红包
	var lastID uint64 = 0
	var totalProcessed int = 0

	for {
		// 使用游标分页查询过期红包
		var expiredEnvelopes []model.RedEnvelope
		if err := db.DB(ctx).
			Where("id > ? AND status = ? AND expires_at < ? AND remaining_amount > 0", lastID, model.RedEnvelopeStatusActive, time.Now()).
			Order("id ASC").
			Limit(batchSize).
			Find(&expiredEnvelopes).Error; err != nil {
			logger.ErrorF(ctx, "查询过期红包失败: %v", err)
			return
		}

		// 没有更多数据，退出循环
		if len(expiredEnvelopes) == 0 {
			break
		}

		logger.InfoF(ctx, "本批次找到 %d 个需要退款的过期红包", len(expiredEnvelopes))

		// 处理每个过期红包
		for _, envelope := range expiredEnvelopes {
			if err := db.DB(ctx).Transaction(func(tx *gorm.DB) error {
				// 更新红包状态为已过期
				if err := tx.Model(&model.RedEnvelope{}).
					Where("id = ? AND status = ?", envelope.ID, model.RedEnvelopeStatusActive).
					Updates(map[string]interface{}{
						"status":           model.RedEnvelopeStatusExpired,
						"remaining_amount": 0,
						"remaining_count":  0,
					}).Error; err != nil {
					return err
				}

				// 退还剩余金额给创建者
				if envelope.RemainingAmount.IsPositive() {
					// 增加余额并减少total_payment
					if err := service.UpdateBalance(tx, service.BalanceUpdateOptions{
						UserID:     envelope.CreatorID,
						Amount:     envelope.RemainingAmount.Neg(),
						Operation:  service.BalanceDeduct,
						TotalField: "total_payment",
					}); err != nil {
						return err
					}

					// 创建退款订单记录
					remarkMsg := fmt.Sprintf("红包过期退款，红包ID:%d", envelope.ID)
					if envelope.Greeting != "" {
						remarkMsg = fmt.Sprintf("%s，祝福语: %s", remarkMsg, envelope.Greeting)
					}

					order := model.Order{
						OrderName:   "红包退款",
						PayerUserID: 0,
						PayeeUserID: envelope.CreatorID,
						Amount:      envelope.RemainingAmount,
						Status:      model.OrderStatusSuccess,
						Type:        model.OrderTypeRedEnvelopeRefund,
						Remark:      remarkMsg,
						TradeTime:   time.Now(),
						ExpiresAt:   time.Now().Add(24 * time.Hour),
					}

					if err := tx.Create(&order).Error; err != nil {
						return err
					}

					logger.InfoF(ctx, "红包ID:%d 退款成功，金额:%s", envelope.ID, envelope.RemainingAmount.String())
				}

				return nil
			}); err != nil {
				logger.ErrorF(ctx, "红包ID:%d 退款失败: %v", envelope.ID, err)
			} else {
				totalProcessed++
			}

			// 更新游标
			lastID = envelope.ID
		}
	}

	if totalProcessed > 0 {
		logger.InfoF(ctx, "退款任务完成，共处理 %d 个过期红包", totalProcessed)
	} else {
		logger.InfoF(ctx, "没有需要退款的过期红包")
	}
}
