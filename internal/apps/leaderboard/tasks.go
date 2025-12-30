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

	"github.com/hibiken/asynq"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/logger"
	"github.com/linux-do/credit/internal/model"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

const (
	maxRankings      = 100
	snapshotCacheTTL = 10 * time.Minute
)

// HandleComputeRankings 计算并存储排行榜快照
func HandleComputeRankings(ctx context.Context, t *asynq.Task) error {
	logger.InfoF(ctx, "[排行榜快照] 开始计算排行榜快照")
	startTime := time.Now()

	periods := []model.PeriodType{
		model.PeriodTypeDay,
		model.PeriodTypeWeek,
		model.PeriodTypeMonth,
		model.PeriodTypeAllTime,
	}
	metrics := []model.MetricType{
		model.MetricReceiveAmount,
		model.MetricPaymentAmount,
		model.MetricTransferInAmount,
		model.MetricTransferOutAmount,
		model.MetricVolumeAmount,
		model.MetricNetAmount,
	}

	snapshotAt := time.Now()
	totalProcessed := 0
	totalErrors := 0

	for _, period := range periods {
		periodInfo := calculatePeriod(PeriodType(period))
		for _, metric := range metrics {
			count, err := computeAndStoreRankings(ctx, period, metric, periodInfo, snapshotAt)
			if err != nil {
				logger.ErrorF(ctx, "[排行榜快照] 计算 %s/%s 失败: %v", period, metric, err)
				totalErrors++
				continue
			}
			totalProcessed += count
		}
	}

	duration := time.Since(startTime)
	logger.InfoF(ctx, "[排行榜快照] 完成，共处理 %d 条记录，%d 个错误，耗时 %v",
		totalProcessed, totalErrors, duration)

	return nil
}

// computeAndStoreRankings 计算单个 period/metric 组合的排名并存储
func computeAndStoreRankings(
	ctx context.Context,
	period model.PeriodType,
	metric model.MetricType,
	periodInfo LeaderboardPeriod,
	snapshotAt time.Time,
) (int, error) {
	// 查询 Top 100 排名
	rankings, err := queryTopRankings(ctx, metric, periodInfo, maxRankings)
	if err != nil {
		return 0, fmt.Errorf("查询排名失败: %w", err)
	}

	if len(rankings) == 0 {
		return 0, nil
	}

	// 获取上一次快照用于计算趋势
	previousRankMap, err := getPreviousRankMap(ctx, period, metric, periodInfo)
	if err != nil {
		logger.WarnF(ctx, "[排行榜快照] 获取历史排名失败，将跳过趋势计算: %v", err)
	}

	// 构建快照记录
	records := make([]model.TradingLeaderboardRanking, len(rankings))
	for i, r := range rankings {
		record := model.TradingLeaderboardRanking{
			PeriodType:  period,
			PeriodStart: periodInfo.StartTime,
			PeriodEnd:   periodInfo.EndTime,
			Metric:      metric,
			SnapshotAt:  snapshotAt,
			Rank:        i + 1,
			UserID:      r.UserID,
			Score:       r.Score,
		}

		// 计算趋势
		if prevRank, ok := previousRankMap[r.UserID]; ok {
			record.PreviousRank = &prevRank
			trend := calculateTrend(i+1, prevRank)
			record.Trend = &trend
		}

		records[i] = record
	}

	// 批量插入
	if err := db.DB(ctx).CreateInBatches(records, 50).Error; err != nil {
		return 0, fmt.Errorf("写入快照失败: %w", err)
	}

	// 预热缓存
	if err := warmupCache(ctx, period, metric, periodInfo, rankings); err != nil {
		logger.WarnF(ctx, "[排行榜快照] 缓存预热失败: %v", err)
	}

	return len(records), nil
}

// rankingResult 排名查询结果
type rankingResult struct {
	UserID   uint64          `gorm:"column:user_id"`
	Username string          `gorm:"column:username"`
	Avatar   string          `gorm:"column:avatar_url"`
	Score    decimal.Decimal `gorm:"column:score"`
}

// queryTopRankings 查询 Top N 排名
func queryTopRankings(ctx context.Context, metric model.MetricType, period LeaderboardPeriod, limit int) ([]rankingResult, error) {
	selectField := getMetricField(MetricType(metric))

	var results []rankingResult
	err := db.DB(ctx).Table("users").
		Select(fmt.Sprintf("users.id as user_id, users.username, users.avatar_url, %s as score", selectField)).
		Joins("LEFT JOIN orders ON (orders.payer_user_id = users.id OR orders.payee_user_id = users.id)").
		Where("orders.status = ?", model.OrderStatusSuccess).
		Where("orders.type IN ?", validOrderTypes).
		Where("orders.payer_user_id != orders.payee_user_id").
		Where("orders.trade_time >= ? AND orders.trade_time < ?", period.StartTime, period.EndTime).
		Group("users.id, users.username, users.avatar_url").
		Having(fmt.Sprintf("%s > 0", selectField)).
		Order("score DESC, users.id ASC").
		Limit(limit).
		Scan(&results).Error

	return results, err
}

// getPreviousRankMap 获取上一次快照的排名映射
func getPreviousRankMap(
	ctx context.Context,
	period model.PeriodType,
	metric model.MetricType,
	periodInfo LeaderboardPeriod,
) (map[uint64]int, error) {
	var prevRecords []model.TradingLeaderboardRanking
	err := db.DB(ctx).
		Where("period_type = ?", period).
		Where("period_start = ?", periodInfo.StartTime.Format("2006-01-02")).
		Where("metric = ?", metric).
		Order("snapshot_at DESC, rank ASC").
		Limit(maxRankings).
		Find(&prevRecords).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	if len(prevRecords) == 0 {
		return nil, nil
	}

	// 取最近一次快照的记录
	latestSnapshot := prevRecords[0].SnapshotAt
	rankMap := make(map[uint64]int)
	for _, r := range prevRecords {
		if r.SnapshotAt.Equal(latestSnapshot) {
			rankMap[r.UserID] = r.Rank
		}
	}

	return rankMap, nil
}

// calculateTrend 计算排名趋势
func calculateTrend(currentRank, previousRank int) model.TrendType {
	if currentRank < previousRank {
		return model.TrendUp
	} else if currentRank > previousRank {
		return model.TrendDown
	}
	return model.TrendSame
}

// warmupCache 预热 Redis 缓存
func warmupCache(
	ctx context.Context,
	period model.PeriodType,
	metric model.MetricType,
	periodInfo LeaderboardPeriod,
	rankings []rankingResult,
) error {
	if db.Redis == nil {
		return nil
	}

	// 构建缓存数据
	items := make([]LeaderboardEntry, len(rankings))
	for i, r := range rankings {
		items[i] = LeaderboardEntry{
			Rank:      i + 1,
			UserID:    r.UserID,
			Username:  r.Username,
			AvatarURL: r.Avatar,
			Score:     r.Score,
		}
	}

	response := &ListResponse{
		Period:     periodInfo,
		Metric:     MetricType(metric),
		SnapshotAt: time.Now().Format(time.RFC3339),
		Page:       1,
		PageSize:   maxRankings,
		Total:      int64(len(rankings)),
		Items:      items,
	}

	cacheKey := fmt.Sprintf("%ssnapshot:%s:%s:%s", cacheKeyPrefix, period, metric, periodInfo.Start)
	data, err := json.Marshal(response)
	if err != nil {
		return err
	}

	return db.Redis.Set(ctx, db.PrefixedKey(cacheKey), data, snapshotCacheTTL).Err()
}
