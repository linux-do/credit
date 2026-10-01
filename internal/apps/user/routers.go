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
	"errors"
	"net/http"
	"regexp"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
)

// UpdatePayKeyRequest 更新支付密钥请求
type UpdatePayKeyRequest struct {
	CurrentPayKey string `json:"current_pay_key" binding:"omitempty,len=6,numeric"`
	PayKey        string `json:"pay_key" binding:"required,len=6,numeric"`
}

var payKeyPattern = regexp.MustCompile(`^\d{6}$`)

func validatePayKeyUpdate(user *model.User, currentPayKey, newPayKey string) error {
	if !payKeyPattern.MatchString(newPayKey) {
		return errors.New(InvalidPayKeyFormat)
	}
	if user.PayKey == "" {
		return nil
	}
	if !payKeyPattern.MatchString(currentPayKey) {
		if currentPayKey == "" {
			return errors.New(InvalidCurrentPayKey)
		}
		return errors.New(InvalidPayKeyFormat)
	}
	if !user.VerifyPayKey(currentPayKey) {
		return errors.New(InvalidCurrentPayKey)
	}
	return nil
}

// UpdatePayKey 更新用户支付密钥
// @Tags user
// @Accept json
// @Produce json
// @Param request body UpdatePayKeyRequest true "request body"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/user/pay-key [put]
func UpdatePayKey(c *gin.Context) {
	var req UpdatePayKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	user, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)
	if user == nil {
		c.JSON(http.StatusUnauthorized, util.Err("未授权"))
		return
	}
	if err := validatePayKeyUpdate(user, req.CurrentPayKey, req.PayKey); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	encryptedPayKey, err := util.Encrypt(user.SignKey, req.PayKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(EncryptPayKeyFailed))
		return
	}

	if err := db.DB(c.Request.Context()).
		Model(&model.User{}).
		Where("id = ?", user.ID).
		Update("pay_key", encryptedPayKey).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}
