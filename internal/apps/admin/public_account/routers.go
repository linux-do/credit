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

package public_account

import (
	"net/http"
	"slices"
	"strconv"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// listPublicAccountsRequest 公共账号列表查询请求
type listPublicAccountsRequest struct {
	Page     int `form:"page" binding:"min=1"`
	PageSize int `form:"page_size" binding:"min=1,max=100"`
}

// publicAccount 公共账号信息
type publicAccount struct {
	ID        int64  `json:"id,string"`
	Username  string `json:"username"`
	Nickname  string `json:"nickname"`
	AvatarUrl string `json:"avatar_url"`
	IsActive  bool   `json:"is_active"`
}

// listPublicAccountsResponse 公共账号列表响应
type listPublicAccountsResponse struct {
	Users []publicAccount `json:"users"`
	Total int64           `json:"total"`
}

// ListPublicAccounts 列出公共账号（负数 ID）
// @Tags admin
// @Produce json
// @Param request query listPublicAccountsRequest true "查询参数"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/admin/public-accounts [get]
func ListPublicAccounts(c *gin.Context) {
	var req listPublicAccountsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	var accounts []publicAccount
	var total int64

	query := db.DB(c.Request.Context()).Table("users").Where("id < ?", 0)

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	offset := (req.Page - 1) * req.PageSize
	if err := query.
		Select("id, username, nickname, avatar_url, is_active").
		Order("id DESC").
		Offset(offset).
		Limit(req.PageSize).
		Find(&accounts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(listPublicAccountsResponse{
		Users: accounts,
		Total: total,
	}))
}

// bindPublicAccountsRequest 绑定公共账号请求（全量同步，空数组即清空授权）
type bindPublicAccountsRequest struct {
	PublicUserIDs []int64 `json:"public_user_ids" binding:"dive,lt=0"`
}

// BindPublicAccounts 设置用户的公共账号授权（全量同步：先清空再按请求重建；空数组即清空授权）
// @Tags admin
// @Produce json
// @Param id path int64 true "目标用户ID"
// @Param request body bindPublicAccountsRequest true "绑定请求"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/admin/users/{id}/bind-public [post]
func BindPublicAccounts(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || userID <= 0 {
		c.JSON(http.StatusBadRequest, util.Err(invalidTargetAccount))
		return
	}

	// gin 校验：每个元素为负数（dive,lt=0）
	var req bindPublicAccountsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(invalidBindRequest))
		return
	}

	// 排序 + 去重
	publicIDs := slices.Compact(slices.Sorted(slices.Values(req.PublicUserIDs)))

	var count int64
	if err := db.DB(c.Request.Context()).Model(&model.User{}).
		Where("id IN ?", append(slices.Clone(publicIDs), userID)).
		Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}
	if count != int64(len(publicIDs)+1) {
		c.JSON(http.StatusNotFound, util.Err(bindTargetNotFound))
		return
	}

	// 删除本次未保留的绑定；插入期望绑定，已存在的由唯一索引跳过
	if err := db.DB(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		query := tx.Where("user_id = ?", userID)
		if len(publicIDs) > 0 {
			query = query.Where("public_account_id NOT IN ?", publicIDs)
		}
		if err := query.Delete(&model.PublicAccountBinding{}).Error; err != nil {
			return err
		}

		if len(publicIDs) == 0 {
			return nil
		}
		bindings := make([]model.PublicAccountBinding, 0, len(publicIDs))
		for _, id := range publicIDs {
			bindings = append(bindings, model.PublicAccountBinding{PublicAccountID: id, UserID: userID})
		}
		return tx.Clauses(clause.OnConflict{DoNothing: true}).Create(bindings).Error
	}); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}

// SwitchAccount 管理员切换到公共账号身份
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

	// 查询条件限定 id < 0 且与路径参数一致：非公共账号会命中 NotFound 分支
	var targetAccount model.User
	if err := db.DB(c.Request.Context()).Where("id = ? AND id < ? AND is_active = ?", accountID, 0, true).First(&targetAccount).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, util.Err(targetAccountNotFound))
			return
		}
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	session := sessions.Default(c)
	session.Set(oauth.UserIDKey, targetAccount.ID)
	session.Set(oauth.UserNameKey, targetAccount.Username)
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}
