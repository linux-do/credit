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

package model

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/linux-do/pay/internal/util"
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

type OAuthUserInfo struct {
	Id         uint64     `json:"id"`
	Username   string     `json:"username"`
	Name       string     `json:"name"`
	Active     bool       `json:"active"`
	AvatarUrl  string     `json:"avatar_url"`
	TrustLevel TrustLevel `json:"trust_level"`
}

// UserGamificationScoreResponse API响应
type UserGamificationScoreResponse struct {
	GamificationScore int64 `json:"gamification_score"`
}

type User struct {
	ID               uint64          `json:"id" gorm:"primaryKey"`
	Username         string          `json:"username" gorm:"size:64;uniqueIndex;index"`
	Nickname         string          `json:"nickname" gorm:"size:100"`
	AvatarUrl        string          `json:"avatar_url" gorm:"size:100"`
	TrustLevel       TrustLevel      `json:"trust_level" gorm:"index"`
	PayScore         int64           `json:"pay_score" gorm:"default:0;index"`
	PayKey           string          `json:"pay_key" gorm:"size:10;index"`
	SignKey          string          `json:"sign_key" gorm:"size:64;uniqueIndex;index;not null"`
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

func (u *User) Exact(tx *gorm.DB, id uint64) error {
	if err := tx.Where("id = ?", id).First(u).Error; err != nil {
		return err
	}
	return nil
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
