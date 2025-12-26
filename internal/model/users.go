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

package model

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/linux-do/credit/internal/common"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/logger"
	"github.com/linux-do/credit/internal/task"
	"github.com/linux-do/credit/internal/task/scheduler"
	"github.com/linux-do/credit/internal/util"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type TrustLevel uint8

const (
	TrustLevelNewUser TrustLevel = iota
	TrustLevelBasicUser
	TrustLevelUser
	TrustLevelActiveUser
	TrustLevelLeader
)

// OAuthUserInfo 用户信息结构（同时支持 OIDC ID Token claims 和 UserEndpoint 响应）
type OAuthUserInfo struct {
	Id         uint64     `json:"id"`
	Sub        string     `json:"sub"`
	Username   string     `json:"username"`
	Name       string     `json:"name"`
	Active     bool       `json:"active"`
	AvatarUrl  string     `json:"avatar_url"`
	TrustLevel TrustLevel `json:"trust_level"`
}

// GetID 获取用户 ID
func (u *OAuthUserInfo) GetID() uint64 {
	if u.Id != 0 {
		return u.Id
	}
	// 从 sub 解析（OIDC 格式）
	if u.Sub != "" {
		if id, err := strconv.ParseUint(u.Sub, 10, 64); err == nil {
			return id
		}
	}
	return 0
}

// UserGamificationScoreResponse API响应
type UserGamificationScoreResponse struct {
	User struct {
		GamificationScore int64 `json:"gamification_score"`
	} `json:"user"`
}

// LeaderboardResponse 排行榜 API 响应
type LeaderboardResponse struct {
	Users []LeaderboardUser `json:"users"`
}

// LeaderboardUser 排行榜用户信息
type LeaderboardUser struct {
	ID         uint64 `json:"id"`
	Username   string `json:"username"`
	TotalScore int64  `json:"total_score"`
}

type User struct {
	ID               uint64          `json:"id" gorm:"primaryKey"`
	Username         string          `json:"username" gorm:"size:64;uniqueIndex"`
	Nickname         string          `json:"nickname" gorm:"size:100"`
	AvatarUrl        string          `json:"avatar_url" gorm:"size:100"`
	TrustLevel       TrustLevel      `json:"trust_level" gorm:"index"`
	PayScore         int64           `json:"pay_score" gorm:"default:0;index"`
	PayKey           string          `json:"pay_key" gorm:"size:128"`
	SignKey          string          `json:"sign_key" gorm:"size:64;uniqueIndex;not null"`
	TotalReceive     decimal.Decimal `json:"total_receive" gorm:"type:numeric(20,2);default:0"`
	TotalPayment     decimal.Decimal `json:"total_payment" gorm:"type:numeric(20,2);default:0"`
	TotalTransfer    decimal.Decimal `json:"total_transfer" gorm:"type:numeric(20,2);default:0"`
	TotalCommunity   decimal.Decimal `json:"total_community" gorm:"type:numeric(20,2);default:0"`
	CommunityBalance decimal.Decimal `json:"community_balance" gorm:"type:numeric(20,2);default:0"`
	AvailableBalance decimal.Decimal `json:"available_balance" gorm:"type:numeric(20,2);default:0"`
	IsActive         bool            `json:"is_active" gorm:"default:true"`
	IsAdmin          bool            `json:"is_admin" gorm:"default:false"`
	LastLoginAt      time.Time       `json:"last_login_at" gorm:"index"`
	CreatedAt        time.Time       `json:"created_at" gorm:"autoCreateTime;index"`
	UpdatedAt        time.Time       `json:"updated_at" gorm:"autoUpdateTime;index"`
}

func (u *User) GetByID(tx *gorm.DB, id uint64) error {
	if err := tx.Where("id = ?", id).First(u).Error; err != nil {
		return err
	}
	return nil
}

// GetByIDs 批量查询用户
func GetByIDs(tx *gorm.DB, ids []uint64) ([]User, error) {
	var users []User
	if err := tx.Where("id IN ?", ids).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

// VerifyPayKey 验证用户支付密码
// 使用用户的 SignKey 解密存储的加密密码，然后与输入的明文密码比较
func (u *User) VerifyPayKey(inputPayKey string) bool {
	if u.PayKey == "" {
		return false
	}
	decrypted, err := util.Decrypt(u.SignKey, u.PayKey)
	if err != nil {
		return false
	}

	return subtle.ConstantTimeCompare([]byte(decrypted), []byte(inputPayKey)) == 1
}

func (u *User) GetUserGamificationScore(ctx context.Context) (*UserGamificationScoreResponse, error) {
	url := fmt.Sprintf("https://linux.do/u/%s.json", u.Username)
	resp, err := util.Request(ctx, http.MethodGet, url, nil, nil, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("获取用户积分失败，状态码: %d", resp.StatusCode)
	}

	var response UserGamificationScoreResponse
	if err = json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("解析用户积分响应失败: %w", err)
	}
	return &response, nil
}

// GetLeaderboard 获取排行榜数据
func GetLeaderboard(ctx context.Context, page int) (*LeaderboardResponse, error) {
	url := fmt.Sprintf("https://linux.do/leaderboard/1.json?period=all_time&page=%d", page)
	resp, err := util.Request(ctx, http.MethodGet, url, nil, nil, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("获取排行榜失败，状态码: %d", resp.StatusCode)
	}

	var response LeaderboardResponse
	if err = json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("解析排行榜响应失败: %w", err)
	}
	return &response, nil
}

// UpdateFromOAuthInfo 根据 OAuth 信息更新用户数据
func (u *User) UpdateFromOAuthInfo(oauthInfo *OAuthUserInfo) {
	u.Username = oauthInfo.Username
	u.Nickname = oauthInfo.Name
	u.AvatarUrl = oauthInfo.AvatarUrl
	u.IsActive = oauthInfo.Active
	u.TrustLevel = oauthInfo.TrustLevel
	u.LastLoginAt = time.Now()
}

// CheckActive 检查用户账户是否激活,未激活则返回错误
func (u *User) CheckActive() error {
	if !u.IsActive {
		return errors.New(common.BannedAccount)
	}
	return nil
}

// EnqueueBadgeScoreTask 为用户下发积分计算任务
func (u *User) EnqueueBadgeScoreTask(ctx context.Context, delay time.Duration) error {
	payload, _ := json.Marshal(map[string]interface{}{
		"user_id": u.ID,
	})

	opts := []asynq.Option{
		asynq.Queue(task.QueueWhitelistOnly),
		asynq.MaxRetry(5),
		asynq.TaskID(fmt.Sprintf("user_gamification_score_%d", u.ID)),
	}
	if delay > 0 {
		opts = append(opts, asynq.ProcessIn(delay))
	}

	if _, err := scheduler.AsynqClient.Enqueue(asynq.NewTask(task.UpdateSingleUserGamificationScoreTask, payload), opts...); err != nil {
		logger.ErrorF(ctx, "下发用户[%s]积分计算任务失败: %v", u.Username, err)
		return err
	}
	return nil
}

// CreateWithInitialCredit 创建新用户并初始化积分、订单
// 如果u不为空(u.ID != 0)，会先将当前用户标记为已注销，然后创建新用户
func (u *User) CreateWithInitialCredit(ctx context.Context, oauthInfo *OAuthUserInfo) error {
	return db.DB(ctx).Transaction(func(tx *gorm.DB) error {
		// 如果当前用户不为空，先注销当前用户
		if u.ID != 0 {
			oldUsername := fmt.Sprintf("%s已注销: %s", u.Username, uuid.NewString())
			if err := tx.Model(u).Updates(map[string]interface{}{
				"username":  oldUsername,
				"is_active": false,
			}).Error; err != nil {
				return err
			}
		}

		newUserInitialCredit, err := GetDecimalByKey(ctx, ConfigKeyNewUserInitialCredit, 2)
		if err != nil {
			return err
		}

		now := time.Now()
		newUser := User{
			ID:               oauthInfo.GetID(),
			Username:         oauthInfo.Username,
			Nickname:         oauthInfo.Name,
			AvatarUrl:        oauthInfo.AvatarUrl,
			IsActive:         oauthInfo.Active,
			TrustLevel:       oauthInfo.TrustLevel,
			SignKey:          util.GenerateUniqueIDSimple(),
			TotalReceive:     newUserInitialCredit,
			AvailableBalance: newUserInitialCredit,
			LastLoginAt:      now,
		}
		if err = tx.Create(&newUser).Error; err != nil {
			return err
		}

		order := Order{
			OrderName:   "新用户注册奖励",
			PayerUserID: 0,
			PayeeUserID: newUser.ID,
			Amount:      newUserInitialCredit,
			Status:      OrderStatusSuccess,
			Type:        OrderTypeCommunity,
			Remark:      fmt.Sprintf("新用户 %s 注册赠送初始积分 %s", newUser.Username, newUserInitialCredit.String()),
			TradeTime:   now,
			ExpiresAt:   now,
		}
		if err = tx.Create(&order).Error; err != nil {
			return err
		}

		*u = newUser

		return u.EnqueueBadgeScoreTask(ctx, 0)
	})
}
