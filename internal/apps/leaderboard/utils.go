/*
Copyright 2025-2026 linux.do

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
	"time"

	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
)

func getCacheTTL(ctx context.Context) time.Duration {
	ttl, err := model.GetIntByKey(ctx, model.ConfigKeyLeaderboardCacheTTLSeconds)
	if err != nil || ttl <= 0 {
		ttl = 30
	}
	return time.Duration(ttl) * time.Second
}

func queryLeaderboard(ctx context.Context, req *ListRequest) ([]LeaderboardEntry, int64, error) {
	offset := (req.Page - 1) * req.PageSize

	baseQuery := db.DB(ctx).Model(&model.User{})

	var total int64
	if err := baseQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var items []LeaderboardEntry
	if err := baseQuery.
		Select("id as user_id, username, avatar_url, available_balance").
		Order("available_balance DESC, id ASC").
		Offset(offset).
		Limit(req.PageSize).
		Scan(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}
