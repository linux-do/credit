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
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/pay/internal/apps/oauth"
	"github.com/linux-do/pay/internal/db"
	"github.com/linux-do/pay/internal/model"
	"github.com/linux-do/pay/internal/util"
)

// UpdatePayKeyRequest 更新支付密钥请求
type UpdatePayKeyRequest struct {
	PayKey string `json:"pay_key" binding:"required,max=10"`
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

	if err := db.DB(c.Request.Context()).
		Model(&model.User{}).
		Where("id = ?", user.ID).
		Update("pay_key", req.PayKey).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}
