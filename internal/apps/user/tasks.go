/*
 * MIT License
 *
 * Copyright (c) 2025 linux.do
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

package user

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/hibiken/asynq"
	"github.com/linux-do/pay/internal/config"
	"github.com/linux-do/pay/internal/db"
	"github.com/linux-do/pay/internal/logger"
	"github.com/linux-do/pay/internal/model"
	"github.com/linux-do/pay/internal/task"
	"github.com/linux-do/pay/internal/task/schedule"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// HandleUpdateUserGamificationScores 处理所有用户积分更新任务
func HandleUpdateUserGamificationScores(ctx context.Context, t *asynq.Task) error {
	// 分页处理用户
	pageSize := 200
	lastID := uint64(0)
	currentDelay := 0 * time.Second

	// 计算一周前日期
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	sessionAgeDays := config.Config.App.SessionAge / 86400
	if sessionAgeDays < 7 {
		sessionAgeDays = 7
	}
	oneWeekAgo := today.AddDate(0, 0, -sessionAgeDays)

	for {
		var users []model.User
		if err := db.DB(ctx).Where("id > ? AND last_login_at >= ? AND is_active = ?", lastID, oneWeekAgo, true).
			Select("id, username").
			Order("id ASC").
			Limit(pageSize).
			Find(&users).Error; err != nil {
			logger.ErrorF(ctx, "查询用户失败: %v", err)
			return err
		}

		// 没有用户，退出循环
		if len(users) == 0 {
			break
		}

		for _, user := range users {
			currentDelay += time.Duration(config.Config.Schedule.UserGamificationScoreDispatchIntervalSeconds) * time.Second

			payload, _ := json.Marshal(map[string]interface{}{
				"user_id": user.ID,
			})

			if _, errTask := schedule.AsynqClient.Enqueue(asynq.NewTask(task.UpdateSingleUserGamificationScoreTask, payload), asynq.ProcessIn(currentDelay), asynq.MaxRetry(3)); errTask != nil {
				logger.ErrorF(ctx, "下发用户[%s]积分计算任务失败: %v", user.Username, errTask)
				return errTask
			} else {
				logger.InfoF(ctx, "下发用户[%s]积分计算任务成功", user.Username)
			}
		}

		lastID = users[len(users)-1].ID
	}
	return nil
}

// HandleUpdateSingleUserGamificationScore 处理单个用户积分更新任务
func HandleUpdateSingleUserGamificationScore(ctx context.Context, t *asynq.Task) error {
	// 解析任务参数
	var payload struct {
		UserID uint64 `json:"user_id"`
	}
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("解析任务参数失败: %w", err)
	}

	var user model.User
	if err := db.DB(ctx).Where("id = ?", payload.UserID).First(&user).Error; err != nil {
		return fmt.Errorf("查询用户ID[%d]失败: %w", payload.UserID, err)
	}

	// 获取用户积分
	response, errGet := user.GetUserGamificationScore(ctx)
	if errGet != nil {
		logger.ErrorF(ctx, "处理用户[%s]失败: %v", user.Username, errGet)
		return errGet
	}

	newCommunityBalance := decimal.NewFromInt(response.GamificationScore)

	if user.CommunityBalance.IsZero() && user.TotalCommunity.IsZero() {
		if err := db.DB(ctx).Model(&user).UpdateColumns(map[string]interface{}{
			"community_balance": newCommunityBalance,
		}).Error; err != nil {
			return fmt.Errorf("初始化用户[%s]社区积分失败: %w", user.Username, err)
		}
		logger.InfoF(ctx, "用户[%s]首次同步社区积分: %s", user.Username, newCommunityBalance.String())
		return nil
	}

	if newCommunityBalance.Equal(user.CommunityBalance) {
		logger.InfoF(ctx, "用户[%s]积分未变化，跳过更新", user.Username)
		return nil
	}

	// 计算差值
	diff := newCommunityBalance.Sub(user.CommunityBalance)
	oldCommunityBalance := user.CommunityBalance
	now := time.Now()

	if err := db.DB(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&user).UpdateColumns(map[string]interface{}{
			"community_balance": newCommunityBalance,
			"total_community":   gorm.Expr("total_community + ?", diff),
			"total_receive":     gorm.Expr("total_receive + ?", diff),
			"available_balance": gorm.Expr("available_balance + ?", diff),
		}).Error; err != nil {
			return fmt.Errorf("更新用户[%s]积分失败: %w", user.Username, err)
		}

		order := model.Order{
			OrderName:   "社区积分更新",
			PayerUserID: 0,
			PayeeUserID: user.ID,
			Amount:      diff,
			Status:      model.OrderStatusSuccess,
			Type:        model.OrderTypeCommunity,
			Remark:      fmt.Sprintf("社区积分从 %s 更新到 %s，变化 %s", oldCommunityBalance.String(), newCommunityBalance.String(), diff.String()),
			TradeTime:   now,
			ExpiresAt:   now,
		}
		if err := tx.Create(&order).Error; err != nil {
			return fmt.Errorf("创建用户[%s]社区积分订单失败: %w", user.Username, err)
		}

		return nil
	}); err != nil {
		logger.ErrorF(ctx, "处理用户[%s]积分更新失败: %v", user.Username, err)
		return err
	}

	return nil
}
