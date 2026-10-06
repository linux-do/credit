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
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// UpdatePayKeyRequest 更新支付密钥请求
type UpdatePayKeyRequest struct {
	// CurrentPayKey 当前安全密码；已设置安全密码的用户修改时必须提供
	CurrentPayKey string `json:"current_pay_key,omitempty" minLength:"6" maxLength:"6" example:"123456"`
	// PayKey 新安全密码，必须为6位数字
	PayKey string `json:"pay_key" validate:"required" minLength:"6" maxLength:"6" example:"654321"`
}

var payKeyPattern = regexp.MustCompile(`^\d{6}$`)

func validatePayKeyFormat(currentPayKey, newPayKey string) error {
	if !payKeyPattern.MatchString(newPayKey) {
		return errInvalidPayKeyFormat
	}

	if currentPayKey != "" && !payKeyPattern.MatchString(currentPayKey) {
		return errInvalidPayKeyFormat
	}

	return nil
}

func validatePayKeyUpdate(user *model.User, currentPayKey, newPayKey string) error {
	if err := validatePayKeyFormat(currentPayKey, newPayKey); err != nil {
		return err
	}
	if user.PayKey == "" {
		return nil
	}

	if currentPayKey == "" {
		return errInvalidCurrentPayKey
	}

	if !user.VerifyPayKey(currentPayKey) {
		return errInvalidCurrentPayKey
	}
	return nil
}

// UpdatePayKey 更新用户支付密钥
// @Tags user
// @Accept json
// @Produce json
// @Param request body UpdatePayKeyRequest true "request body"
// @Success 200 {object} util.ResponseAny
// @Failure 400 {object} util.ResponseAny
// @Failure 401 {object} util.ResponseAny
// @Failure 500 {object} util.ResponseAny
// @Router /api/v1/user/pay-key [put]
func UpdatePayKey(c *gin.Context) {
	var req UpdatePayKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(
			http.StatusBadRequest,
			util.ErrCode(
				ErrorCodeInvalidPayKeyFormat,
				InvalidPayKeyFormat,
			),
		)
		return
	}

	// 先做与用户状态无关的格式校验。
	// 这样长度、数字格式等错误不会进入数据库事务。
	if err := validatePayKeyFormat(req.CurrentPayKey, req.PayKey); err != nil {
		c.JSON(
			http.StatusBadRequest,
			util.ErrCode(
				ErrorCodeInvalidPayKeyFormat,
				InvalidPayKeyFormat,
			),
		)
		return
	}

	user, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)
	if user == nil {
		c.JSON(http.StatusUnauthorized, util.Err("未授权"))
		return
	}
	/*
		必须在同一事务内重新读取并锁定用户行。

		不能直接使用 LoginRequired 中加载进 context 的 user.PayKey：
		两个并发修改请求可能同时拿旧密码通过校验，
		导致后一个请求覆盖前一个请求。
	*/
	err := db.DB(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		var currentUser model.User

		if err := tx.
			Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ?", user.ID).
			First(&currentUser).Error; err != nil {
			return err
		}

		if err := validatePayKeyUpdate(
			&currentUser,
			req.CurrentPayKey,
			req.PayKey,
		); err != nil {
			return err
		}

		encryptedPayKey, err := util.Encrypt(
			currentUser.SignKey,
			req.PayKey,
		)
		if err != nil {
			return errEncryptPayKeyFailed
		}

		return tx.
			Model(&currentUser).
			Update("pay_key", encryptedPayKey).
			Error
	})

	if err == nil {
		c.JSON(http.StatusOK, util.OKNil())
		return
	}

	if errors.Is(err, errInvalidCurrentPayKey) {
		c.JSON(
			http.StatusBadRequest,
			util.ErrCode(
				ErrorCodeInvalidCurrentPayKey,
				InvalidCurrentPayKey,
			),
		)
		return
	}

	if errors.Is(err, errInvalidPayKeyFormat) {
		c.JSON(
			http.StatusBadRequest,
			util.ErrCode(
				ErrorCodeInvalidPayKeyFormat,
				InvalidPayKeyFormat,
			),
		)
		return
	}

	if errors.Is(err, errEncryptPayKeyFailed) {
		c.JSON(
			http.StatusInternalServerError,
			util.Err(EncryptPayKeyFailed),
		)
		return
	}

	c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
}
