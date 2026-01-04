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

package dashboard

import (
	"context"
	"time"

	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/shopspring/decimal"
)

// getDateRange 计算查询的时间范围
func getDateRange(days int) (startDate, endDate time.Time) {
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	return todayStart.AddDate(0, 0, -(days - 1)), todayStart.AddDate(0, 0, 1)
}

// dailyAmountResult 每日金额查询结果
type dailyAmountResult struct {
	Date   time.Time
	Amount decimal.Decimal
}

// queryDailyAmounts 查询每日金额
// isIncome: true=收入(payee), false=支出(payer)
func queryDailyAmounts(ctx context.Context, userID uint64, isIncome bool, startDate, endDate time.Time) (map[string]decimal.Decimal, error) {
	var results []dailyAmountResult
	var err error

	if isIncome {
		// 收入查询：payee_user_id = user
		// 包括：普通收款、红包领取(red_envelope_receive)、红包退款(red_envelope_refund)
		err = db.DB(ctx).Model(&model.Order{}).
			Select("DATE_TRUNC('day', created_at) as date, SUM(amount) as amount").
			Where("payee_user_id = ?", userID).
			Where("status = ?", model.OrderStatusSuccess).
			Where("created_at >= ? AND created_at < ?", startDate, endDate).
			Group("DATE_TRUNC('day', created_at)").
			Scan(&results).Error
	} else {
		// 支出查询：payer_user_id = user，但排除 red_envelope_receive
		// red_envelope_receive 的 payer_user_id 是红包创建者，但创建者的支出已在 red_envelope_send 时计算
		err = db.DB(ctx).Model(&model.Order{}).
			Select("DATE_TRUNC('day', created_at) as date, SUM(amount) as amount").
			Where("payer_user_id = ?", userID).
			Where("status = ?", model.OrderStatusSuccess).
			Where("type != ?", model.OrderTypeRedEnvelopeReceive).
			Where("created_at >= ? AND created_at < ?", startDate, endDate).
			Group("DATE_TRUNC('day', created_at)").
			Scan(&results).Error
	}

	if err != nil {
		return nil, err
	}

	// 转换为 map
	statsMap := make(map[string]decimal.Decimal)
	for _, r := range results {
		dateStr := r.Date.Format("2006-01-02")
		statsMap[dateStr] = r.Amount
	}

	return statsMap, nil
}

// mergeDailyStats 合并收入和支出统计，填充无数据的日期
func mergeDailyStats(startDate time.Time, days int, incomeMap, expenseMap map[string]decimal.Decimal) []DailyStatsItem {
	result := make([]DailyStatsItem, days)

	for i := range result {
		dateStr := startDate.AddDate(0, 0, i).Format("2006-01-02")
		result[i] = DailyStatsItem{
			Date:    dateStr,
			Income:  incomeMap[dateStr],
			Expense: expenseMap[dateStr],
		}
	}

	return result
}
