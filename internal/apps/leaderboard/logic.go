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

	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/shopspring/decimal"
)

// 有效订单类型：payment, online, transfer
var validOrderTypes = []model.OrderType{
	model.OrderTypePayment,
	model.OrderTypeOnline,
	model.OrderTypeTransfer,
}

func getList(ctx context.Context, req *ListRequest) (*ListResponse, error) {
	if req.Period == "" {
		req.Period = PeriodWeek
	}
	if req.Metric == "" {
		req.Metric = MetricVolumeAmount
	}
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = defaultPageSize
	}

	period := calculatePeriod(req.Period)

	// 1. 检查 Redis 缓存
	cacheKey := fmt.Sprintf("%slist:%s:%s:%s:%d:%d", cacheKeyPrefix, req.Period, req.Metric, period.Start, req.Page, req.PageSize)
	if cached, err := getFromCache(ctx, cacheKey); err == nil && cached != nil {
		return cached, nil
	}

	// 2. 尝试从快照表读取（第一页且 pageSize <= 100 时优先使用快照）
	if req.Page == 1 && req.PageSize <= maxRankings {
		if response, err := getListFromSnapshot(ctx, req, period); err == nil && response != nil {
			_ = setToCache(ctx, cacheKey, response, cacheTTL)
			return response, nil
		}
	}

	// 3. 实时聚合查询
	items, total, err := queryLeaderboard(ctx, req, period)
	if err != nil {
		return nil, err
	}

	response := &ListResponse{
		Period:     period,
		Metric:     req.Metric,
		SnapshotAt: time.Now().Format(time.RFC3339),
		Page:       req.Page,
		PageSize:   req.PageSize,
		Total:      total,
		Items:      items,
	}

	_ = setToCache(ctx, cacheKey, response, cacheTTL)
	return response, nil
}

// getListFromSnapshot 从快照表读取排行榜
func getListFromSnapshot(ctx context.Context, req *ListRequest, period LeaderboardPeriod) (*ListResponse, error) {
	var rankings []model.TradingLeaderboardRanking
	subQuery := db.DB(ctx).Model(&model.TradingLeaderboardRanking{}).
		Select("MAX(snapshot_at)").
		Where("period_type = ?", model.PeriodType(req.Period)).
		Where("period_start = ?", period.StartTime.Format("2006-01-02")).
		Where("metric = ?", model.MetricType(req.Metric))

	if err := db.DB(ctx).
		Where("period_type = ?", model.PeriodType(req.Period)).
		Where("period_start = ?", period.StartTime.Format("2006-01-02")).
		Where("metric = ?", model.MetricType(req.Metric)).
		Where("snapshot_at = (?)", subQuery).
		Where("rank <= ?", req.PageSize).
		Order("rank ASC").
		Find(&rankings).Error; err != nil {
		return nil, err
	}

	if len(rankings) == 0 {
		return nil, fmt.Errorf("no snapshot available")
	}

	// 检查快照是否过期（超过 15 分钟视为过期）
	if time.Since(rankings[0].SnapshotAt) > 15*time.Minute {
		return nil, fmt.Errorf("snapshot expired")
	}

	// 批量获取用户信息
	userIDs := make([]uint64, len(rankings))
	for i, r := range rankings {
		userIDs[i] = r.UserID
	}
	userMap := getUserInfoMap(ctx, userIDs)

	items := make([]LeaderboardEntry, len(rankings))
	for i, r := range rankings {
		entry := LeaderboardEntry{
			Rank:   r.Rank,
			UserID: r.UserID,
			Score:  r.Score,
		}
		if user, ok := userMap[r.UserID]; ok {
			entry.Username = user.Username
			entry.AvatarURL = user.AvatarUrl
		}
		if r.Trend != nil {
			entry.Trend = TrendType(*r.Trend)
		}
		entry.PreviousRank = r.PreviousRank
		items[i] = entry
	}

	return &ListResponse{
		Period:     period,
		Metric:     req.Metric,
		SnapshotAt: rankings[0].SnapshotAt.Format(time.RFC3339),
		Page:       1,
		PageSize:   req.PageSize,
		Total:      int64(len(items)),
		Items:      items,
	}, nil
}

// getUserInfoMap 批量获取用户基本信息
func getUserInfoMap(ctx context.Context, userIDs []uint64) map[uint64]model.User {
	if len(userIDs) == 0 {
		return nil
	}

	var users []model.User
	db.DB(ctx).Select("id, username, avatar_url").Where("id IN ?", userIDs).Find(&users)

	result := make(map[uint64]model.User, len(users))
	for _, u := range users {
		result[u.ID] = u
	}
	return result
}

func getUserRank(ctx context.Context, userID uint64, req *ListRequest) (*UserRankResponse, error) {
	if req.Period == "" {
		req.Period = PeriodWeek
	}
	if req.Metric == "" {
		req.Metric = MetricVolumeAmount
	}

	period := calculatePeriod(req.Period)

	// 优先从快照表查询（Top 100 内）
	if response, err := getUserRankFromSnapshot(ctx, userID, req, period); err == nil && response != nil {
		return response, nil
	}

	// 实时查询
	rank, score, err := queryUserRank(ctx, userID, req, period)
	if err != nil {
		return nil, err
	}

	return &UserRankResponse{
		Period:     period,
		Metric:     req.Metric,
		SnapshotAt: time.Now().Format(time.RFC3339),
		User: UserRankInfo{
			UserID: userID,
			Rank:   rank,
			Score:  score,
		},
	}, nil
}

// getUserRankFromSnapshot 从快照表读取用户排名
func getUserRankFromSnapshot(ctx context.Context, userID uint64, req *ListRequest, period LeaderboardPeriod) (*UserRankResponse, error) {
	subQuery := db.DB(ctx).Model(&model.TradingLeaderboardRanking{}).
		Select("MAX(snapshot_at)").
		Where("period_type = ?", model.PeriodType(req.Period)).
		Where("period_start = ?", period.StartTime.Format("2006-01-02")).
		Where("metric = ?", model.MetricType(req.Metric))

	var ranking model.TradingLeaderboardRanking
	if err := db.DB(ctx).
		Where("user_id = ?", userID).
		Where("period_type = ?", model.PeriodType(req.Period)).
		Where("period_start = ?", period.StartTime.Format("2006-01-02")).
		Where("metric = ?", model.MetricType(req.Metric)).
		Where("snapshot_at = (?)", subQuery).
		First(&ranking).Error; err != nil {
		return nil, err
	}

	// 检查快照是否过期
	if time.Since(ranking.SnapshotAt) > 15*time.Minute {
		return nil, fmt.Errorf("snapshot expired")
	}

	userInfo := UserRankInfo{
		UserID:       userID,
		Rank:         ranking.Rank,
		Score:        ranking.Score,
		PreviousRank: ranking.PreviousRank,
	}
	if ranking.Trend != nil {
		userInfo.Trend = TrendType(*ranking.Trend)
	}

	return &UserRankResponse{
		Period:     period,
		Metric:     req.Metric,
		SnapshotAt: ranking.SnapshotAt.Format(time.RFC3339),
		User:       userInfo,
	}, nil
}

func getMetadata() *MetadataResponse {
	resp := &MetadataResponse{
		Periods: []PeriodType{PeriodDay, PeriodWeek, PeriodMonth, PeriodAllTime},
		Metrics: []MetricInfo{
			{Key: MetricVolumeAmount, Name: "交易总额"},
			{Key: MetricReceiveAmount, Name: "收款总额"},
			{Key: MetricPaymentAmount, Name: "付款总额"},
			{Key: MetricTransferInAmount, Name: "转入总额"},
			{Key: MetricTransferOutAmount, Name: "转出总额"},
			{Key: MetricNetAmount, Name: "净收入"},
		},
		Timezone: "Asia/Shanghai",
	}
	resp.Defaults.Period = PeriodWeek
	resp.Defaults.Metric = MetricVolumeAmount
	resp.Defaults.PageSize = defaultPageSize
	return resp
}

func calculatePeriod(periodType PeriodType) LeaderboardPeriod {
	loc, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		loc = time.FixedZone("CST", 8*3600)
	}
	now := time.Now().In(loc)

	var start, end time.Time
	switch periodType {
	case PeriodDay:
		start = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
		end = start.AddDate(0, 0, 1)
	case PeriodWeek:
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7
		}
		start = time.Date(now.Year(), now.Month(), now.Day()-weekday+1, 0, 0, 0, 0, loc)
		end = start.AddDate(0, 0, 7)
	case PeriodMonth:
		start = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
		end = start.AddDate(0, 1, 0)
	case PeriodAllTime:
		start = time.Date(2020, 1, 1, 0, 0, 0, 0, loc)
		end = now.AddDate(1, 0, 0)
	}

	return LeaderboardPeriod{
		Type:      periodType,
		Start:     start.Format("2006-01-02"),
		End:       end.Format("2006-01-02"),
		StartTime: start,
		EndTime:   end,
	}
}

func queryLeaderboard(ctx context.Context, req *ListRequest, period LeaderboardPeriod) ([]LeaderboardEntry, int64, error) {
	offset := (req.Page - 1) * req.PageSize
	selectField := getMetricField(req.Metric)

	var results []struct {
		UserID   uint64          `gorm:"column:user_id"`
		Username string          `gorm:"column:username"`
		Avatar   string          `gorm:"column:avatar_url"`
		Score    decimal.Decimal `gorm:"column:score"`
	}

	// 基础查询：关联 users 和 orders
	// 关键修正：
	// 1. 使用 trade_time 替代 created_at
	// 2. 仅统计 payment/online/transfer 类型
	// 3. 排除自成交（payer_user_id != payee_user_id）
	subQuery := db.DB(ctx).Table("users").
		Select(fmt.Sprintf("users.id as user_id, users.username, users.avatar_url, %s as score", selectField)).
		Joins("LEFT JOIN orders ON (orders.payer_user_id = users.id OR orders.payee_user_id = users.id)").
		Where("orders.status = ?", model.OrderStatusSuccess).
		Where("orders.type IN ?", validOrderTypes).
		Where("orders.payer_user_id != orders.payee_user_id").
		Where("orders.trade_time >= ? AND orders.trade_time < ?", period.StartTime, period.EndTime).
		Group("users.id, users.username, users.avatar_url").
		Having(fmt.Sprintf("%s > 0", selectField))

	var total int64
	if err := db.DB(ctx).Table("(?) as ranked", subQuery).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := db.DB(ctx).Table("(?) as ranked", subQuery).
		Order("score DESC, user_id ASC").
		Offset(offset).Limit(req.PageSize).
		Scan(&results).Error; err != nil {
		return nil, 0, err
	}

	items := make([]LeaderboardEntry, len(results))
	for i, r := range results {
		items[i] = LeaderboardEntry{
			Rank:      offset + i + 1,
			UserID:    r.UserID,
			Username:  r.Username,
			AvatarURL: r.Avatar,
			Score:     r.Score,
		}
	}

	return items, total, nil
}

func queryUserRank(ctx context.Context, userID uint64, req *ListRequest, period LeaderboardPeriod) (int, decimal.Decimal, error) {
	selectField := getMetricField(req.Metric)

	var result struct {
		Score decimal.Decimal `gorm:"column:score"`
	}

	// 查询用户自己的分数
	// 关键修正：使用 trade_time、限制订单类型、排除自成交
	if err := db.DB(ctx).Table("users").
		Select(fmt.Sprintf("%s as score", selectField)).
		Joins("LEFT JOIN orders ON (orders.payer_user_id = users.id OR orders.payee_user_id = users.id)").
		Where("users.id = ?", userID).
		Where("orders.status = ?", model.OrderStatusSuccess).
		Where("orders.type IN ?", validOrderTypes).
		Where("orders.payer_user_id != orders.payee_user_id").
		Where("orders.trade_time >= ? AND orders.trade_time < ?", period.StartTime, period.EndTime).
		Group("users.id").
		Scan(&result).Error; err != nil {
		return 0, decimal.Zero, err
	}

	// 计算排名：统计分数比当前用户高的人数
	rankSQL := fmt.Sprintf(`
		SELECT COUNT(*) FROM (
			SELECT users.id, %s as score
			FROM users
			LEFT JOIN orders ON (orders.payer_user_id = users.id OR orders.payee_user_id = users.id)
			WHERE orders.status = ?
			  AND orders.type IN (?, ?, ?)
			  AND orders.payer_user_id != orders.payee_user_id
			  AND orders.trade_time >= ? AND orders.trade_time < ?
			GROUP BY users.id
			HAVING %s > 0
		) ranked
		WHERE ranked.score > ? OR (ranked.score = ? AND ranked.id < ?)
	`, selectField, selectField)

	var rank int64
	if err := db.DB(ctx).Raw(rankSQL,
		model.OrderStatusSuccess,
		model.OrderTypePayment, model.OrderTypeOnline, model.OrderTypeTransfer,
		period.StartTime, period.EndTime,
		result.Score, result.Score, userID,
	).Scan(&rank).Error; err != nil {
		return 0, decimal.Zero, err
	}

	return int(rank + 1), result.Score, nil
}

func getMetricField(metric MetricType) string {
	switch metric {
	case MetricReceiveAmount:
		return "COALESCE(SUM(CASE WHEN orders.payee_user_id = users.id THEN orders.amount ELSE 0 END), 0)"
	case MetricPaymentAmount:
		return "COALESCE(SUM(CASE WHEN orders.payer_user_id = users.id THEN orders.amount ELSE 0 END), 0)"
	case MetricTransferInAmount:
		return fmt.Sprintf("COALESCE(SUM(CASE WHEN orders.payee_user_id = users.id AND orders.type = '%s' THEN orders.amount ELSE 0 END), 0)", model.OrderTypeTransfer)
	case MetricTransferOutAmount:
		return fmt.Sprintf("COALESCE(SUM(CASE WHEN orders.payer_user_id = users.id AND orders.type = '%s' THEN orders.amount ELSE 0 END), 0)", model.OrderTypeTransfer)
	case MetricNetAmount:
		return "COALESCE(SUM(CASE WHEN orders.payee_user_id = users.id THEN orders.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN orders.payer_user_id = users.id THEN orders.amount ELSE 0 END), 0)"
	case MetricVolumeAmount:
		fallthrough
	default:
		return "COALESCE(SUM(orders.amount), 0)"
	}
}

func getFromCache(ctx context.Context, key string) (*ListResponse, error) {
	if db.Redis == nil {
		return nil, fmt.Errorf("redis not available")
	}

	data, err := db.Redis.Get(ctx, db.PrefixedKey(key)).Bytes()
	if err != nil {
		return nil, err
	}

	var response ListResponse
	if err := json.Unmarshal(data, &response); err != nil {
		return nil, err
	}

	return &response, nil
}

func setToCache(ctx context.Context, key string, response *ListResponse, ttl time.Duration) error {
	if db.Redis == nil {
		return fmt.Errorf("redis not available")
	}

	data, err := json.Marshal(response)
	if err != nil {
		return err
	}

	return db.Redis.Set(ctx, db.PrefixedKey(key), data, ttl).Err()
}
