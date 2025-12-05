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

package merchant

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/pay/internal/apps/oauth"
	"github.com/linux-do/pay/internal/db"
	"github.com/linux-do/pay/internal/model"
	"github.com/linux-do/pay/internal/util"
)

type CreateAPIKeyRequest struct {
	AppName        string `json:"app_name" binding:"required,max=20"`
	AppHomepageURL string `json:"app_homepage_url" binding:"required,max=100,url"`
	AppDescription string `json:"app_description" binding:"max=100"`
	RedirectURI    string `json:"redirect_uri" binding:"required,max=100,url"`
}

type UpdateAPIKeyRequest struct {
	AppName        string `json:"app_name" binding:"omitempty,max=20"`
	AppHomepageURL string `json:"app_homepage_url" binding:"omitempty,max=100,url"`
	AppDescription string `json:"app_description" binding:"omitempty,max=100"`
	RedirectURI    string `json:"redirect_uri" binding:"omitempty,max=100,url"`
}

type APIKeyListResponse struct {
	Total int64                  `json:"total"`
	Data  []model.MerchantAPIKey `json:"data"`
}

// CreateAPIKey 创建商户 API Key
// @Tags merchant
// @Accept json
// @Produce json
// @Param request body CreateAPIKeyRequest true "request body"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/merchant/api-keys [post]
func CreateAPIKey(c *gin.Context) {
	var req CreateAPIKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	user, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	apiKey := model.MerchantAPIKey{
		UserID:         user.ID,
		ClientID:       util.GenerateUniqueIDSimple(),
		ClientSecret:   util.GenerateUniqueIDSimple(),
		AppName:        req.AppName,
		AppHomepageURL: req.AppHomepageURL,
		AppDescription: req.AppDescription,
		RedirectURI:    req.RedirectURI,
	}

	if err := db.DB(c.Request.Context()).Create(&apiKey).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(apiKey))
}

// ListAPIKeys 获取商户 API Key 列表
// @Tags merchant
// @Produce json
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/merchant/api-keys [get]
func ListAPIKeys(c *gin.Context) {
	user, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	var apiKeys []model.MerchantAPIKey
	if err := db.DB(c.Request.Context()).
		Where("user_id = ?", user.ID).
		Order("created_at DESC").
		Find(&apiKeys).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(apiKeys))
}

// GetAPIKey 获取单个商户 API Key
// @Tags merchant
// @Produce json
// @Param id path uint64 true "API Key ID"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/merchant/api-keys/{id} [get]
func GetAPIKey(c *gin.Context) {
	apiKey, _ := util.GetFromContext[*model.MerchantAPIKey](c, APIKeyObjKey)
	c.JSON(http.StatusOK, util.OK(apiKey))
}

// UpdateAPIKey 更新商户 API Key
// @Tags merchant
// @Accept json
// @Produce json
// @Param id path uint64 true "API Key ID"
// @Param request body UpdateAPIKeyRequest true "request body"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/merchant/api-keys/{id} [put]
func UpdateAPIKey(c *gin.Context) {
	var req UpdateAPIKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	apiKey, _ := util.GetFromContext[*model.MerchantAPIKey](c, APIKeyObjKey)

	updates := make(map[string]interface{})
	if req.AppName != "" {
		updates["app_name"] = req.AppName
	}
	if req.AppHomepageURL != "" {
		updates["app_homepage_url"] = req.AppHomepageURL
	}
	if req.AppDescription != "" {
		updates["app_description"] = req.AppDescription
	}
	if req.RedirectURI != "" {
		updates["redirect_uri"] = req.RedirectURI
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, util.Err(NoFieldsToUpdate))
		return
	}

	if err := db.DB(c.Request.Context()).
		Model(&apiKey).
		Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}

// DeleteAPIKey 删除商户 API Key
// @Tags merchant
// @Produce json
// @Param id path uint64 true "API Key ID"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/merchant/api-keys/{id} [delete]
func DeleteAPIKey(c *gin.Context) {
	apiKey, _ := util.GetFromContext[*model.MerchantAPIKey](c, APIKeyObjKey)

	if err := db.DB(c.Request.Context()).Delete(&apiKey).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}
