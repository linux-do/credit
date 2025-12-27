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

package user

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/go-redis/redis_rate/v10"
	"github.com/hibiken/asynq"
	"github.com/linux-do/credit/internal/common"
	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/logger"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/task"
	"github.com/linux-do/credit/internal/task/scheduler"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

var (
	linuxDoRateLimiter *redis_rate.Limiter
	rateLimitKey       string
)

func init() {
	linuxDoRateLimiter = redis_rate.NewLimiter(db.Redis)
	rateLimitKey = db.PrefixedKey(linuxDoAPIRateLimitKey)
}

// waitForRateLimit 等待获取限流令牌（阻塞直到获取到令牌）
func waitForRateLimit(ctx context.Context, key string, limit redis_rate.Limit) error {
	for {
		res, err := linuxDoRateLimiter.Allow(ctx, key, limit)
		if err != nil {
			return fmt.Errorf("redis 限流器错误: %w", err)
		}
		if res.Allowed > 0 {
			return nil // 获取到令牌
		}
		// 未获取到令牌，等待后重试
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(res.RetryAfter):
			// 继续重试
		}
	}
}

// HandleUpdateUserGamificationScores 处理所有用户积分更新任务
func HandleUpdateUserGamificationScores(ctx context.Context, t *asynq.Task) error {
	rateLimit := config.Config.Worker.GamificationScoreRateLimit
	limit := redis_rate.Limit{
		Rate:   rateLimit.Rate,
		Burst:  rateLimit.Rate,
		Period: time.Duration(rateLimit.Period) * time.Second,
	}

	page := 0
	totalProcessed := 0

	for {
		if err := waitForRateLimit(ctx, rateLimitKey, limit); err != nil {
			logger.ErrorF(ctx, "速率限制等待失败: %v", err)
			return err
		}

		leaderboard, err := model.GetLeaderboard(ctx, page)
		if err != nil {
			logger.ErrorF(ctx, "获取排行榜第 %d 页失败: %v", page, err)
			return err
		}

		if len(leaderboard.Users) == 0 {
			logger.InfoF(ctx, "[调度] 排行榜数据处理完成，共处理 %d 个用户", totalProcessed)
			break
		}

		if err = enqueueBatchScoreTask(ctx, leaderboard.Users); err != nil {
			logger.ErrorF(ctx, "下发第 %d 页批量任务失败: %v", page, err)
			return err
		}

		totalProcessed += len(leaderboard.Users)
		logger.InfoF(ctx, "[调度] 已处理排行榜第 %d 页，本页 %d 个用户，累计 %d 个用户",
			page, len(leaderboard.Users), totalProcessed)

		page++
	}

	return nil
}

// enqueueBatchScoreTask 下发批量积分更新任务
func enqueueBatchScoreTask(ctx context.Context, userScores []model.LeaderboardUser) error {
	payload, _ := json.Marshal(map[string]interface{}{
		"user_scores": userScores,
	})

	opts := []asynq.Option{
		asynq.Queue(task.QueueWhitelistOnly),
		asynq.MaxRetry(5),
	}

	if _, err := scheduler.AsynqClient.Enqueue(asynq.NewTask(task.UpdateSingleUserGamificationScoreTask, payload), opts...); err != nil {
		logger.ErrorF(ctx, "下发批量积分任务失败: %v", err)
		return err
	}
	return nil
}

// batchUpdateUserScores 批量更新用户积分
func batchUpdateUserScores(ctx context.Context, userScores []model.LeaderboardUser) error {
	if len(userScores) == 0 {
		return nil
	}

	userIDs := make([]uint64, len(userScores))
	scoreMap := make(map[uint64]int64, len(userScores))
	for i, u := range userScores {
		userIDs[i] = u.ID
		scoreMap[u.ID] = u.TotalScore
	}

	users, err := model.GetByIDs(db.DB(ctx), userIDs)
	if err != nil {
		return fmt.Errorf("批量查询用户失败: %w", err)
	}

	protectionDays, err := model.GetIntByKey(ctx, model.ConfigKeyNewUserProtectionDays)
	if err != nil {
		return fmt.Errorf("%s: %w", common.GetProtectionDaysFailed, err)
	}

	now := time.Now()

	return db.DB(ctx).Transaction(func(tx *gorm.DB) error {
		for _, user := range users {
			newScore, exists := scoreMap[user.ID]
			if !exists {
				continue
			}

			newCommunityBalance := decimal.NewFromInt(newScore)
			oldCommunityBalance := user.CommunityBalance
			diff := newCommunityBalance.Sub(oldCommunityBalance)

			createOrder := func(amount decimal.Decimal, remark string) error {
				order := model.Order{
					OrderName:   "社区积分更新",
					PayerUserID: 0,
					PayeeUserID: user.ID,
					Amount:      amount,
					Status:      model.OrderStatusSuccess,
					Type:        model.OrderTypeCommunity,
					Remark:      remark,
					TradeTime:   now,
					ExpiresAt:   now,
				}
				if err = tx.Create(&order).Error; err != nil {
					return fmt.Errorf("创建用户[%s]订单失败: %w", user.Username, err)
				}
				return nil
			}

			if user.CommunityBalance.IsZero() && user.TotalCommunity.IsZero() {
				if err = tx.Model(&user).UpdateColumns(map[string]interface{}{
					"community_balance": newCommunityBalance,
				}).Error; err != nil {
					return fmt.Errorf("初始化用户[%s]社区积分失败: %w", user.Username, err)
				}
				logger.InfoF(ctx, "用户[%s]首次同步社区积分: %s", user.Username, newCommunityBalance.String())
				continue
			}

			// 积分未变化
			if diff.IsZero() {
				remark := fmt.Sprintf("社区积分从 %s 更新到 %s，变化 %s", oldCommunityBalance.String(), newCommunityBalance.String(), diff.String())
				if err = createOrder(decimal.Zero, remark); err != nil {
					return err
				}
				continue
			}

			// 新用户保护期检查
			if diff.IsNegative() && protectionDays > 0 {
				registeredDays := int(time.Since(user.CreatedAt).Hours() / 24)
				if registeredDays < protectionDays {
					if err = tx.Model(&user).UpdateColumns(map[string]interface{}{
						"community_balance": newCommunityBalance,
					}).Error; err != nil {
						return fmt.Errorf("更新用户[%s]积分失败: %w", user.Username, err)
					}
					remark := fmt.Sprintf("社区积分从 %s 更新到 %s，变化 %s（保护期内，跳过扣分）",
						oldCommunityBalance.String(), newCommunityBalance.String(), diff.String())
					if err = createOrder(decimal.Zero, remark); err != nil {
						return err
					}
					logger.InfoF(ctx, "用户[%s]在保护期内，积分下降%s，跳过扣分", user.Username, diff.Abs().String())
					continue
				}
			}

			// 更新用户积分
			if err = tx.Model(&user).UpdateColumns(map[string]interface{}{
				"community_balance": newCommunityBalance,
				"total_community":   gorm.Expr("total_community + ?", diff),
				"total_receive":     gorm.Expr("total_receive + ?", diff),
				"available_balance": gorm.Expr("available_balance + ?", diff),
			}).Error; err != nil {
				return fmt.Errorf("更新用户[%s]积分失败: %w", user.Username, err)
			}

			remark := fmt.Sprintf("社区积分从 %s 更新到 %s，变化 %s",
				oldCommunityBalance.String(), newCommunityBalance.String(), diff.String())
			if err = createOrder(diff, remark); err != nil {
				return err
			}
		}
		return nil
	})
}

// HandleUpdateSingleUserGamificationScore 处理用户积分更新任务
func HandleUpdateSingleUserGamificationScore(ctx context.Context, t *asynq.Task) error {
	var payload struct {
		UserID     uint64                  `json:"user_id"`
		UserScores []model.LeaderboardUser `json:"user_scores"`
	}
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("解析任务参数失败: %w", err)
	}

	if len(payload.UserScores) > 0 {
		return batchUpdateUserScores(ctx, payload.UserScores)
	}

	if payload.UserID > 0 {
		var user model.User
		if err := user.GetByID(db.DB(ctx), payload.UserID); err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				logger.InfoF(ctx, "用户[%d]不存在，跳过积分更新", payload.UserID)
				return nil
			}
			return fmt.Errorf("查询用户[%d]失败: %w", payload.UserID, err)
		}

		response, errGet := user.GetUserGamificationScore(ctx)
		if errGet != nil {
			logger.ErrorF(ctx, "处理用户[%s]失败: %v", user.Username, errGet)
			return errGet
		}

		return batchUpdateUserScores(ctx, []model.LeaderboardUser{
			{ID: payload.UserID, TotalScore: response.User.GamificationScore},
		})
	}

	return nil
}
