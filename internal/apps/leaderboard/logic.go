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

	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
)

func getList(ctx context.Context, req *ListRequest) (*ListResponse, error) {
	// 检查 Redis 缓存
	cacheKey := fmt.Sprintf("%slist:p:%d:s:%d", cacheKeyPrefix, req.Page, req.PageSize)
	if data, err := db.Redis.Get(ctx, db.PrefixedKey(cacheKey)).Bytes(); err == nil {
		var cached ListResponse
		if err := json.Unmarshal(data, &cached); err == nil {
			return &cached, nil
		}
	}

	// 2. 查询数据库
	items, total, err := queryLeaderboard(ctx, req)
	if err != nil {
		return nil, err
	}

	response := &ListResponse{
		SortBy:   "available_balance",
		Order:    "desc",
		Page:     req.Page,
		PageSize: req.PageSize,
		Total:    total,
		Items:    items,
	}

	if data, err := json.Marshal(response); err == nil {
		_ = db.Redis.Set(ctx, db.PrefixedKey(cacheKey), data, getCacheTTL(ctx)).Err()
	}
	return response, nil
}

func getUserRank(ctx context.Context, userID uint64) (*UserRankResponse, error) {
	// 检查缓存
	cacheKey := fmt.Sprintf("%suser:%d", cacheKeyPrefix, userID)
	if data, err := db.Redis.Get(ctx, db.PrefixedKey(cacheKey)).Bytes(); err == nil {
		var cached UserRankResponse
		if err := json.Unmarshal(data, &cached); err == nil {
			return &cached, nil
		}
	}

	// 查询用户余额
	var user model.User
	if err := db.DB(ctx).Select("id, available_balance").Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, err
	}

	// 计算排名：统计比当前用户排位更高的人数
	// 排序规则：available_balance DESC, id ASC
	// 即：余额更高，或余额相同但 id 更小
	var rank int64
	if err := db.DB(ctx).Model(&model.User{}).
		Where("(available_balance > ?) OR (available_balance = ? AND id < ?)",
			user.AvailableBalance, user.AvailableBalance, userID).
		Count(&rank).Error; err != nil {
		return nil, err
	}

	response := &UserRankResponse{
		User: UserRankInfo{
			UserID:           userID,
			Rank:             int(rank + 1),
			AvailableBalance: user.AvailableBalance,
		},
	}

	if data, err := json.Marshal(response); err == nil {
		_ = db.Redis.Set(ctx, db.PrefixedKey(cacheKey), data, getCacheTTL(ctx)).Err()
	}
	return response, nil
}
