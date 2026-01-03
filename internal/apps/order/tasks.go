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

package order

import (
	"context"
	"encoding/json"
	"time"

	"github.com/hibiken/asynq"
	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/logger"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
)

// HandleSyncOrdersToClickHouse 同步订单数据
func HandleSyncOrdersToClickHouse(ctx context.Context, t *asynq.Task) error {
	if !config.Config.ClickHouse.Enabled {
		logger.InfoF(ctx, "ClickHouse 未启用，跳过订单同步")
		return nil
	}

	var payload struct {
		StartTime *time.Time `json:"start_time"`
		EndTime   *time.Time `json:"end_time"`
	}
	_ = json.Unmarshal(t.Payload(), &payload)

	var startOfDay, endOfDay time.Time
	if payload.StartTime != nil && payload.EndTime != nil {
		startOfDay = *payload.StartTime
		endOfDay = *payload.EndTime
	} else {
		now := time.Now()
		yesterday := now.AddDate(0, 0, -1)
		startOfDay = time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, yesterday.Location())
		endOfDay = startOfDay.AddDate(0, 0, 1)
	}

	logger.InfoF(ctx, "开始同步订单到 ClickHouse: %s ~ %s", startOfDay.Format("2006-01-02 15:04:05"), endOfDay.Format("2006-01-02 15:04:05"))

	pageSize := 10000
	lastID := uint64(0)
	totalSynced := 0

	for {
		var orders []model.Order
		if err := db.DB(ctx).
			Where("updated_at >= ? AND updated_at < ? AND id > ?", startOfDay, endOfDay, lastID).
			Order("id ASC").
			Limit(pageSize).
			Find(&orders).Error; err != nil {
			logger.ErrorF(ctx, "查询订单失败: %v", err)
			return err
		}

		if len(orders) == 0 {
			break
		}

		if err := batchInsertToClickHouse(ctx, orders); err != nil {
			logger.ErrorF(ctx, "写入 ClickHouse 失败: %v", err)
			return err
		}

		totalSynced += len(orders)
		lastID = orders[len(orders)-1].ID

		logger.InfoF(ctx, "已同步 %d 条订单，当前进度 ID: %d", len(orders), lastID)
	}

	logger.InfoF(ctx, "订单同步完成，共同步 %d 条", totalSynced)
	return nil
}

// batchInsertToClickHouse 批量写入订单
func batchInsertToClickHouse(ctx context.Context, orders []model.Order) error {
	batch, err := db.ChConn.PrepareBatch(ctx, `
		INSERT INTO orders (
			id, order_name, merchant_order_no, client_id,
			payer_user_id, payee_user_id, amount,
			status, type, remark, payment_type,
			trade_time, expires_at, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return err
	}

	for _, order := range orders {
		if err := batch.Append(
			order.ID,
			order.OrderName,
			util.DerefString(order.MerchantOrderNo),
			order.ClientID,
			order.PayerUserID,
			order.PayeeUserID,
			order.Amount,
			string(order.Status),
			string(order.Type),
			order.Remark,
			order.PaymentType,
			order.TradeTime,
			order.ExpiresAt,
			order.CreatedAt,
			order.UpdatedAt,
		); err != nil {
			return err
		}
	}

	return batch.Send()
}
