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
	"fmt"
	"time"

	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/shopspring/decimal"
)

// leaderboard_scores：按 (period_type, period_start, metric_type, user_id) 预聚合的得分表
// 由 Asynq 周期任务从 PostgreSQL 聚合写入 ClickHouse。
const leaderboardScoresTable = "leaderboard_scores"

type leaderboardScoreRow struct {
	UserID uint64
	Score  decimal.Decimal
}

func isClickHouseReady() bool {
	return config.Config.ClickHouse.Enabled && db.ChConn != nil
}

// queryLeaderboardClickHouse 从 ClickHouse 读取排行榜列表
func queryLeaderboardClickHouse(ctx context.Context, req *ListRequest, period LeaderboardPeriod) ([]LeaderboardEntry, int64, error) {
	if !isClickHouseReady() {
		return nil, 0, fmt.Errorf("clickhouse not available")
	}
	if req.Page <= 0 || req.PageSize <= 0 {
		return nil, 0, fmt.Errorf("invalid pagination")
	}

	offset := (req.Page - 1) * req.PageSize

	total, err := countLeaderboardUsersClickHouse(ctx, req.Period, period.StartTime, req.Metric)
	if err != nil {
		return nil, 0, err
	}

	rows, err := listLeaderboardUsersClickHouse(ctx, req.Period, period.StartTime, req.Metric, offset, req.PageSize)
	if err != nil {
		return nil, 0, err
	}

	userIDs := make([]uint64, 0, len(rows))
	for _, r := range rows {
		userIDs = append(userIDs, r.UserID)
	}

	userMap, err := loadUsersMap(ctx, userIDs)
	if err != nil {
		return nil, 0, err
	}

	items := make([]LeaderboardEntry, 0, len(rows))
	for i, r := range rows {
		u, ok := userMap[r.UserID]
		if !ok {
			items = append(items, LeaderboardEntry{
				Rank:      offset + i + 1,
				UserID:    r.UserID,
				Username:  "",
				AvatarURL: "",
				Score:     r.Score,
			})
			continue
		}

		items = append(items, LeaderboardEntry{
			Rank:      offset + i + 1,
			UserID:    u.ID,
			Username:  u.Username,
			AvatarURL: u.AvatarUrl,
			Score:     r.Score,
		})
	}

	return items, total, nil
}

// queryUserRankClickHouse 从 ClickHouse 读取用户排名
func queryUserRankClickHouse(ctx context.Context, userID uint64, req *ListRequest, period LeaderboardPeriod) (int, decimal.Decimal, error) {
	if !isClickHouseReady() {
		return 0, decimal.Zero, fmt.Errorf("clickhouse not available")
	}

	score, err := getUserScoreClickHouse(ctx, req.Period, period.StartTime, req.Metric, userID)
	if err != nil {
		return 0, decimal.Zero, err
	}

	above, err := countUsersAboveScoreClickHouse(ctx, req.Period, period.StartTime, req.Metric, score)
	if err != nil {
		return 0, decimal.Zero, err
	}

	return int(above + 1), score, nil
}

func loadUsersMap(ctx context.Context, userIDs []uint64) (map[uint64]model.User, error) {
	result := make(map[uint64]model.User, len(userIDs))
	if len(userIDs) == 0 {
		return result, nil
	}

	users, err := model.GetByIDs(db.DB(ctx), userIDs)
	if err != nil {
		return nil, err
	}

	for _, u := range users {
		result[u.ID] = u
	}
	return result, nil
}

func countLeaderboardUsersClickHouse(ctx context.Context, periodType PeriodType, periodStart time.Time, metric MetricType) (int64, error) {
	q := fmt.Sprintf(`
SELECT count()
FROM (
	SELECT user_id, argMax(score, updated_at) AS score
	FROM %s
	WHERE period_type = ? AND period_start = ? AND metric_type = ?
	GROUP BY user_id
	HAVING score > CAST(0 AS Decimal(20,2))
)
`, leaderboardScoresTable)

	row := db.ChConn.QueryRow(ctx, q, string(periodType), periodStart, string(metric))
	var total int64
	if err := row.Scan(&total); err != nil {
		return 0, err
	}
	return total, nil
}

func listLeaderboardUsersClickHouse(ctx context.Context, periodType PeriodType, periodStart time.Time, metric MetricType, offset, limit int) ([]leaderboardScoreRow, error) {
	q := fmt.Sprintf(`
SELECT user_id, argMax(score, updated_at) AS score
FROM %s
WHERE period_type = ? AND period_start = ? AND metric_type = ?
GROUP BY user_id
HAVING score > CAST(0 AS Decimal(20,2))
ORDER BY score DESC, user_id ASC
LIMIT ? OFFSET ?
`, leaderboardScoresTable)

	rows, err := db.ChConn.Query(ctx, q, string(periodType), periodStart, string(metric), limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]leaderboardScoreRow, 0, limit)
	for rows.Next() {
		var r leaderboardScoreRow
		if err := rows.Scan(&r.UserID, &r.Score); err != nil {
			return nil, err
		}
		result = append(result, r)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return result, nil
}

func getUserScoreClickHouse(ctx context.Context, periodType PeriodType, periodStart time.Time, metric MetricType, userID uint64) (decimal.Decimal, error) {
	q := fmt.Sprintf(`
SELECT argMax(score, updated_at) AS score
FROM %s
WHERE period_type = ? AND period_start = ? AND metric_type = ? AND user_id = ?
`, leaderboardScoresTable)

	row := db.ChConn.QueryRow(ctx, q, string(periodType), periodStart, string(metric), userID)
	var score decimal.Decimal
	if err := row.Scan(&score); err != nil {
		return decimal.Zero, err
	}
	return score, nil
}

func countUsersAboveScoreClickHouse(ctx context.Context, periodType PeriodType, periodStart time.Time, metric MetricType, score decimal.Decimal) (int64, error) {
	q := fmt.Sprintf(`
SELECT count()
FROM (
	SELECT user_id, argMax(score, updated_at) AS score
	FROM %s
	WHERE period_type = ? AND period_start = ? AND metric_type = ?
	GROUP BY user_id
	HAVING score > ?
)
`, leaderboardScoresTable)

	row := db.ChConn.QueryRow(ctx, q, string(periodType), periodStart, string(metric), score)
	var total int64
	if err := row.Scan(&total); err != nil {
		return 0, err
	}
	return total, nil
}
