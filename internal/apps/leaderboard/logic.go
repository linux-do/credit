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

	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/shopspring/decimal"
)

func getList(ctx context.Context, req *ListRequest) (*ListResponse, error) {
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = defaultPageSize
	}

	// 1. 检查 Redis 缓存
	cacheKey := fmt.Sprintf("%slist:p:%d:s:%d", cacheKeyPrefix, req.Page, req.PageSize)
	if cached, err := getFromCache(ctx, cacheKey); err == nil && cached != nil {
		return cached, nil
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

	_ = setToCache(ctx, cacheKey, response, getCacheTTL())
	return response, nil
}

func getUserRank(ctx context.Context, userID uint64) (*UserRankResponse, error) {
	// 检查缓存
	cacheKey := fmt.Sprintf("%suser:%d", cacheKeyPrefix, userID)
	if cached, err := getUserFromCache(ctx, cacheKey); err == nil && cached != nil {
		return cached, nil
	}

	// 查询用户余额
	var user model.User
	if err := db.DB(ctx).Select("id, available_balance").Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, err
	}

	// 计算排名：统计余额比当前用户高的人数
	var rank int64
	if err := db.DB(ctx).Model(&model.User{}).
		Where("available_balance > ?", user.AvailableBalance).
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

	_ = setUserToCache(ctx, cacheKey, response, getCacheTTL())
	return response, nil
}

func getCacheTTL() time.Duration {
	ttl := config.Config.Leaderboard.CacheTTLSeconds
	if ttl <= 0 {
		ttl = 30
	}
	return time.Duration(ttl) * time.Second
}

func getMetadata() *MetadataResponse {
	return &MetadataResponse{
		SortBy: "available_balance",
		Order:  "desc",
		Defaults: struct {
			PageSize int `json:"page_size"`
		}{
			PageSize: defaultPageSize,
		},
	}
}

func queryLeaderboard(ctx context.Context, req *ListRequest) ([]LeaderboardEntry, int64, error) {
	offset := (req.Page - 1) * req.PageSize

	// 统计总数
	var total int64
	if err := db.DB(ctx).Model(&model.User{}).
		Where("available_balance > 0").
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 查询排行榜
	var users []struct {
		ID               uint64          `gorm:"column:id"`
		Username         string          `gorm:"column:username"`
		AvatarURL        string          `gorm:"column:avatar_url"`
		AvailableBalance decimal.Decimal `gorm:"column:available_balance"`
	}

	if err := db.DB(ctx).Table("users").
		Select("id, username, avatar_url, available_balance").
		Where("available_balance > 0").
		Order("available_balance DESC, id ASC").
		Offset(offset).
		Limit(req.PageSize).
		Scan(&users).Error; err != nil {
		return nil, 0, err
	}

	items := make([]LeaderboardEntry, len(users))
	for i, u := range users {
		items[i] = LeaderboardEntry{
			Rank:             offset + i + 1,
			UserID:           u.ID,
			Username:         u.Username,
			AvatarURL:        u.AvatarURL,
			AvailableBalance: u.AvailableBalance,
		}
	}

	return items, total, nil
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

func getUserFromCache(ctx context.Context, key string) (*UserRankResponse, error) {
	if db.Redis == nil {
		return nil, fmt.Errorf("redis not available")
	}

	data, err := db.Redis.Get(ctx, db.PrefixedKey(key)).Bytes()
	if err != nil {
		return nil, err
	}

	var response UserRankResponse
	if err := json.Unmarshal(data, &response); err != nil {
		return nil, err
	}

	return &response, nil
}

func setUserToCache(ctx context.Context, key string, response *UserRankResponse, ttl time.Duration) error {
	if db.Redis == nil {
		return fmt.Errorf("redis not available")
	}

	data, err := json.Marshal(response)
	if err != nil {
		return err
	}

	return db.Redis.Set(ctx, db.PrefixedKey(key), data, ttl).Err()
}
