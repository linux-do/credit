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

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
	"gorm.io/gorm"
)

// PublicAccountInfo 公共账号信息
type PublicAccountInfo struct {
	ID        int64  `json:"id,string"`
	Username  string `json:"username"`
	Nickname  string `json:"nickname"`
	AvatarUrl string `json:"avatar_url"`
}

// PublicAccountsResponse 公共账号绑定列表响应
type PublicAccountsResponse struct {
	// 可切换的公共账号列表（仅真实身份下有值）
	PublicAccounts []PublicAccountInfo `json:"public_accounts"`
}

// GetPublicAccounts 获取当前用户绑定的公共账号列表
// @Tags user
// @Produce json
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/user/public-accounts [get]
func GetPublicAccounts(c *gin.Context) {
	currentUser, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)
	response := PublicAccountsResponse{}

	// 仅真实身份返回绑定列表；公共账号身份无切换能力（退出重登恢复）
	if currentUser.ID < 0 {
		c.JSON(http.StatusOK, util.OK(response))
		return
	}

	var accounts []PublicAccountInfo
	if err := db.DB(c.Request.Context()).
		Table("public_account_bindings").
		Select("users.id AS id, users.username AS username, users.nickname AS nickname, users.avatar_url AS avatar_url").
		Joins("JOIN users ON users.id = public_account_bindings.public_account_id").
		Where("public_account_bindings.user_id = ?", currentUser.ID).
		Scan(&accounts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}
	response.PublicAccounts = accounts

	c.JSON(http.StatusOK, util.OK(response))
}

// switchPublicAccountRequest 切换公共账号请求
type switchPublicAccountRequest struct {
	PublicUserID int64 `json:"public_user_id,string" binding:"required"`
}

// SwitchPublicAccount 切换到已绑定的公共账号身份
// @Tags user
// @Produce json
// @Param request body switchPublicAccountRequest true "切换请求"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/user/public-accounts/switch [post]
func SwitchPublicAccount(c *gin.Context) {
	currentUser, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)
	if currentUser.ID < 0 {
		c.JSON(http.StatusBadRequest, util.Err(switchPublicNotAllowed))
		return
	}

	var req switchPublicAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(invalidPublicRequest))
		return
	}
	if req.PublicUserID >= 0 {
		c.JSON(http.StatusBadRequest, util.Err(invalidPublicRequest))
		return
	}

	tx := db.DB(c.Request.Context())

	// 校验绑定关系存在
	var binding model.PublicAccountBinding
	if err := tx.Where("user_id = ? AND public_account_id = ?", currentUser.ID, req.PublicUserID).First(&binding).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusBadRequest, util.Err(publicAccountNotBound))
			return
		}
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	// 公共账号必须可用
	var publicAccount model.User
	if err := tx.Where("id = ? AND is_active = ?", req.PublicUserID, true).First(&publicAccount).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusBadRequest, util.Err(publicAccountUnavailable))
			return
		}
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	// 切换后 session 身份变为公共账号，恢复原身份需退出重新登录
	session := sessions.Default(c)
	session.Set(oauth.UserIDKey, publicAccount.ID)
	session.Set(oauth.UserNameKey, publicAccount.Username)
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}
