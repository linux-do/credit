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

package api_key

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/apps/merchant"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
)

type CreateAPIKeyRequest struct {
	AppName        string `json:"app_name" binding:"required,max=20"`
	AppHomepageURL string `json:"app_homepage_url" binding:"required,max=100,url"`
	AppDescription string `json:"app_description" binding:"max=100"`
	RedirectURL    string `json:"redirect_url" binding:"omitempty,max=100,url"`
	NotifyURL      string `json:"notify_url" binding:"required,max=100,url"`
	TestMode       bool   `json:"test_mode"`
}

type UpdateAPIKeyRequest struct {
	AppName        string `json:"app_name" binding:"omitempty,max=20"`
	AppHomepageURL string `json:"app_homepage_url" binding:"omitempty,max=100,url"`
	AppDescription string `json:"app_description" binding:"omitempty,max=100"`
	RedirectURL    string `json:"redirect_url" binding:"omitempty,max=100,url"`
	NotifyURL      string `json:"notify_url" binding:"omitempty,max=100,url"`
	TestMode       bool   `json:"test_mode"`
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
		RedirectURL:    req.RedirectURL,
		NotifyURL:      req.NotifyURL,
		TestMode:       req.TestMode,
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
	apiKey, _ := util.GetFromContext[*model.MerchantAPIKey](c, merchant.APIKeyObjKey)
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

	apiKey, _ := util.GetFromContext[*model.MerchantAPIKey](c, merchant.APIKeyObjKey)

	updates := map[string]interface{}{
		"app_name":         req.AppName,
		"app_homepage_url": req.AppHomepageURL,
		"app_description":  req.AppDescription,
		"redirect_url":     req.RedirectURL,
		"notify_url":       req.NotifyURL,
		"test_mode":        req.TestMode,
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
	apiKey, _ := util.GetFromContext[*model.MerchantAPIKey](c, merchant.APIKeyObjKey)

	if err := db.DB(c.Request.Context()).Delete(&apiKey).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}
