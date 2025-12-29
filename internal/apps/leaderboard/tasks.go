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

package leaderboard

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
	"github.com/hibiken/asynq"
	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/logger"
	"github.com/linux-do/credit/internal/model"
	"github.com/shopspring/decimal"
)

const maxRowsPerBatch = 50000

type syncLeaderboardScoresPayload struct {
	PeriodTypes []PeriodType `json:"period_types,omitempty"`
}

type pgUserMetricsRow struct {
	UserID            uint64          `gorm:"column:user_id"`
	ReceiveAmount     decimal.Decimal `gorm:"column:receive_amount"`
	PaymentAmount     decimal.Decimal `gorm:"column:payment_amount"`
	TransferInAmount  decimal.Decimal `gorm:"column:transfer_in_amount"`
	TransferOutAmount decimal.Decimal `gorm:"column:transfer_out_amount"`
	VolumeAmount      decimal.Decimal `gorm:"column:volume_amount"`
}

// HandleSyncLeaderboardScoresToClickHouse 从 PostgreSQL orders 聚合用户得分并写入 ClickHouse leaderboard_scores
func HandleSyncLeaderboardScoresToClickHouse(ctx context.Context, t *asynq.Task) error {
	if !config.Config.ClickHouse.Enabled || db.ChConn == nil {
		logger.InfoF(ctx, "ClickHouse 未启用，跳过排行榜聚合同步")
		return nil
	}

	var payload syncLeaderboardScoresPayload
	_ = json.Unmarshal(t.Payload(), &payload)

	periodTypes := payload.PeriodTypes
	if len(periodTypes) == 0 {
		periodTypes = []PeriodType{PeriodDay, PeriodWeek, PeriodMonth, PeriodAllTime}
	}

	for _, periodType := range periodTypes {
		period := calculatePeriod(periodType, "")
		if err := syncLeaderboardScoresForPeriod(ctx, periodType, period); err != nil {
			logger.ErrorF(ctx, "同步排行榜聚合失败: period=%s err=%v", periodType, err)
			return err
		}
	}

	return nil
}

func syncLeaderboardScoresForPeriod(ctx context.Context, periodType PeriodType, period LeaderboardPeriod) error {
	logger.InfoF(ctx, "开始聚合排行榜数据: period=%s start=%s end=%s",
		periodType,
		period.StartTime.Format("2006-01-02 15:04:05"),
		period.EndTime.Format("2006-01-02 15:04:05"),
	)

	metrics, err := aggregateUserMetricsFromPostgres(ctx, period.StartTime, period.EndTime)
	if err != nil {
		return err
	}

	updatedAt := time.Now()
	periodStart := period.StartTime

	newBatch := func() (driver.Batch, error) {
		q := fmt.Sprintf(`
INSERT INTO %s (
	period_type, period_start, metric_type, user_id, score, updated_at
) VALUES (?, ?, ?, ?, ?, ?)
`, leaderboardScoresTable)
		return db.ChConn.PrepareBatch(ctx, q)
	}

	batch, err := newBatch()
	if err != nil {
		return err
	}

	insertedUsers := 0
	insertedRows := 0

	appendScore := func(userID uint64, metric MetricType, score decimal.Decimal) error {
		if score.IsZero() {
			return nil
		}

		if err := batch.Append(string(periodType), periodStart, string(metric), userID, score, updatedAt); err != nil {
			return err
		}

		insertedRows++
		if insertedRows%maxRowsPerBatch == 0 {
			if err := batch.Send(); err != nil {
				return err
			}
			batch, err = newBatch()
			if err != nil {
				return err
			}
		}
		return nil
	}

	for _, m := range metrics {
		if m.UserID == 0 {
			continue
		}
		insertedUsers++

		if err := appendScore(m.UserID, MetricReceiveAmount, m.ReceiveAmount); err != nil {
			return err
		}
		if err := appendScore(m.UserID, MetricPaymentAmount, m.PaymentAmount); err != nil {
			return err
		}
		if err := appendScore(m.UserID, MetricTransferInAmount, m.TransferInAmount); err != nil {
			return err
		}
		if err := appendScore(m.UserID, MetricTransferOutAmount, m.TransferOutAmount); err != nil {
			return err
		}
		if err := appendScore(m.UserID, MetricVolumeAmount, m.VolumeAmount); err != nil {
			return err
		}

		net := m.ReceiveAmount.Sub(m.PaymentAmount)
		if err := appendScore(m.UserID, MetricNetAmount, net); err != nil {
			return err
		}
	}

	if batch.Rows() > 0 {
		if err := batch.Send(); err != nil {
			return err
		}
	} else {
		_ = batch.Abort()
	}

	logger.InfoF(ctx, "排行榜聚合写入完成: period=%s period_start=%s users=%d rows=%d",
		periodType,
		periodStart.Format("2006-01-02"),
		insertedUsers,
		insertedRows,
	)
	return nil
}

// aggregateUserMetricsFromPostgres 从 PostgreSQL orders 聚合用户在 [startTime, endTime) 的各类金额指标
func aggregateUserMetricsFromPostgres(ctx context.Context, startTime, endTime time.Time) ([]pgUserMetricsRow, error) {
	var rows []pgUserMetricsRow
	sql := `
WITH base AS (
	SELECT payer_user_id, payee_user_id, amount, type
	FROM orders
	WHERE status = ? AND created_at >= ? AND created_at < ?
),
payee AS (
	SELECT
		payee_user_id AS user_id,
		SUM(amount) AS receive_amount,
		0::numeric AS payment_amount,
		SUM(CASE WHEN type = ? THEN amount ELSE 0::numeric END) AS transfer_in_amount,
		0::numeric AS transfer_out_amount,
		SUM(amount) AS volume_amount
	FROM base
	WHERE payee_user_id <> 0
	GROUP BY payee_user_id
),
payer AS (
	SELECT
		payer_user_id AS user_id,
		0::numeric AS receive_amount,
		SUM(amount) AS payment_amount,
		0::numeric AS transfer_in_amount,
		SUM(CASE WHEN type = ? THEN amount ELSE 0::numeric END) AS transfer_out_amount,
		SUM(amount) AS volume_amount
	FROM base
	WHERE payer_user_id <> 0
	GROUP BY payer_user_id
)
SELECT
	user_id,
	SUM(receive_amount) AS receive_amount,
	SUM(payment_amount) AS payment_amount,
	SUM(transfer_in_amount) AS transfer_in_amount,
	SUM(transfer_out_amount) AS transfer_out_amount,
	SUM(volume_amount) AS volume_amount
FROM (
	SELECT * FROM payee
	UNION ALL
	SELECT * FROM payer
) t
GROUP BY user_id
`

	if err := db.DB(ctx).
		Raw(sql, model.OrderStatusSuccess, startTime, endTime, model.OrderTypeTransfer, model.OrderTypeTransfer).
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}
