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
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// listUsersRequest 用户列表查询请求
type listUsersRequest struct {
	Page     int    `form:"page" binding:"min=1"`
	PageSize int    `form:"page_size" binding:"min=1,max=100"`
	UserID   *int64 `form:"user_id"`
	Username string `form:"username"`
}

type user struct {
	ID               int64            `json:"id,string"`
	Username         string           `json:"username"`
	Nickname         string           `json:"nickname"`
	AvatarUrl        string           `json:"avatar_url"`
	TrustLevel       model.TrustLevel `json:"trust_level"`
	PayScore         int64            `json:"pay_score"`
	TotalReceive     decimal.Decimal  `json:"total_receive"`
	TotalPayment     decimal.Decimal  `json:"total_payment"`
	TotalTransfer    decimal.Decimal  `json:"total_transfer"`
	TotalCommunity   decimal.Decimal  `json:"total_community"`
	CommunityBalance decimal.Decimal  `json:"community_balance"`
	AvailableBalance decimal.Decimal  `json:"available_balance"`
	IsActive         bool             `json:"is_active"`
	IsAdmin          bool             `json:"is_admin"`
	LastLoginAt      time.Time        `json:"last_login_at"`
	CreatedAt        time.Time        `json:"created_at"`
	UpdatedAt        time.Time        `json:"updated_at"`
}

// listUsersResponse 用户列表响应
type listUsersResponse struct {
	Users []user `json:"users"`
	Total int64  `json:"total"`
}

// ListUsers 获取用户列表
// @Tags admin
// @Produce json
// @Param request query listUsersRequest true "查询参数"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/admin/users [get]
func ListUsers(c *gin.Context) {
	var req listUsersRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	var users []user
	var total int64

	query := db.DB(c.Request.Context()).Table("users")

	username := strings.TrimSpace(req.Username)

	if req.UserID != nil {
		query = query.Where("id = ?", *req.UserID)
	}

	if username != "" {
		query = query.Where("username LIKE ?", username+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	offset := (req.Page - 1) * req.PageSize
	if err := query.
		Select("id, username, nickname, avatar_url, trust_level, pay_score, " +
			"total_receive, total_payment, total_transfer, total_community, " +
			"community_balance, available_balance, is_active, is_admin, " +
			"last_login_at, created_at, updated_at").
		Order("id DESC").
		Offset(offset).
		Limit(req.PageSize).
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(listUsersResponse{
		Users: users,
		Total: total,
	}))
}

// updateUserStatusRequest 更新用户状态请求
type updateUserStatusRequest struct {
	IsActive bool `json:"is_active"`
}

// UpdateUserStatus 更新用户状态（启用/禁用）
// @Tags admin
// @Produce json
// @Param id path int true "用户ID"
// @Param request body updateUserStatusRequest true "状态"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/admin/users/{id}/status [put]
func UpdateUserStatus(c *gin.Context) {
	var req updateUserStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	id := c.Param("id")

	var targetUser struct {
		ID      int64 `gorm:"column:id"`
		IsAdmin bool  `gorm:"column:is_admin"`
	}
	if err := db.DB(c.Request.Context()).
		Table("users").
		Select("id, is_admin").
		Where("id = ?", id).
		First(&targetUser).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, util.Err(userNotFound))
			return
		}
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	if !req.IsActive && targetUser.IsAdmin {
		c.JSON(http.StatusForbidden, util.Err(cannotDisable))
		return
	}

	if err := db.DB(c.Request.Context()).
		Table("users").
		Where("id = ?", id).
		Update("is_active", req.IsActive).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(updateUserFailed))
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}

// SwitchAccount 管理员切换到指定账号身份
// @Tags admin
// @Produce json
// @Param id path int64 true "目标账号ID"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/admin/users/{id}/switch [post]
func SwitchAccount(c *gin.Context) {
	accountID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, util.Err(invalidTargetAccount))
		return
	}

	var targetAccount model.User
	if err := db.DB(c.Request.Context()).Where("id = ? AND is_active = ?", accountID, true).First(&targetAccount).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, util.Err(targetAccountNotFound))
			return
		}
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	session := sessions.Default(c)
	session.Set(oauth.UserIDKey, accountID)
	session.Set(oauth.UserNameKey, targetAccount.Username)
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}
