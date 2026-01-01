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

package user_pay_config

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// CreateUserPayConfigRequest 创建支付配置请求
type CreateUserPayConfigRequest struct {
	Level          model.PayLevel  `json:"level"`
	MinScore       int64           `json:"min_score" binding:"min=0"`
	MaxScore       *int64          `json:"max_score" binding:"omitempty,gtfield=MinScore"`
	DailyLimit     *int64          `json:"daily_limit"`
	FeeRate        decimal.Decimal `json:"fee_rate" binding:"required"`
	ScoreRate      decimal.Decimal `json:"score_rate" binding:"required"`
	DistributeRate decimal.Decimal `json:"distribute_rate" binding:"required"`
}

// UpdateUserPayConfigRequest 更新支付配置请求
type UpdateUserPayConfigRequest struct {
	MinScore       int64           `json:"min_score" binding:"min=0"`
	MaxScore       *int64          `json:"max_score" binding:"omitempty,gtfield=MinScore"`
	DailyLimit     *int64          `json:"daily_limit"`
	FeeRate        decimal.Decimal `json:"fee_rate" binding:"required"`
	ScoreRate      decimal.Decimal `json:"score_rate" binding:"required"`
	DistributeRate decimal.Decimal `json:"distribute_rate" binding:"required"`
}

// CreateUserPayConfig 创建支付配置
// @Tags admin
// @Accept json
// @Produce json
// @Param request body CreateUserPayConfigRequest true "request body"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/admin/user-pay-configs [post]
func CreateUserPayConfig(c *gin.Context) {
	var req CreateUserPayConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	// 验证费率和积分倍率
	if err := util.ValidateRates(req.FeeRate, req.ScoreRate, req.DistributeRate); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	// 检查等级是否已存在
	var existing model.UserPayConfig
	if err := db.DB(c.Request.Context()).Where("level = ?", req.Level).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, util.Err(LevelExists))
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	config := model.UserPayConfig{
		Level:          req.Level,
		MinScore:       req.MinScore,
		MaxScore:       req.MaxScore,
		DailyLimit:     req.DailyLimit,
		FeeRate:        req.FeeRate,
		ScoreRate:      req.ScoreRate,
		DistributeRate: req.DistributeRate,
	}

	if err := db.DB(c.Request.Context()).Create(&config).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(config))
}

// ListUserPayConfigs 获取支付配置列表
// @Tags admin
// @Produce json
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/admin/user-pay-configs [get]
func ListUserPayConfigs(c *gin.Context) {
	var configs []model.UserPayConfig
	if err := db.DB(c.Request.Context()).
		Order("min_score ASC").
		Find(&configs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(configs))
}

// GetUserPayConfig 获取单个支付配置
// @Tags admin
// @Produce json
// @Param id path string true "配置ID"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/admin/user-pay-configs/{id} [get]
func GetUserPayConfig(c *gin.Context) {
	var config model.UserPayConfig
	if err := db.DB(c.Request.Context()).Where("id = ?", c.Param("id")).First(&config).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, util.Err(UserPayConfigNotFound))
		} else {
			c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		}
		return
	}

	c.JSON(http.StatusOK, util.OK(config))
}

// UpdateUserPayConfig 更新支付配置
// @Tags admin
// @Accept json
// @Produce json
// @Param id path string true "配置ID"
// @Param request body UpdateUserPayConfigRequest true "request body"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/admin/user-pay-configs/{id} [put]
func UpdateUserPayConfig(c *gin.Context) {
	var req UpdateUserPayConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	// 验证费率和积分倍率
	if err := util.ValidateRates(req.FeeRate, req.ScoreRate); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	// 检查配置是否存在
	var config model.UserPayConfig
	if err := db.DB(c.Request.Context()).Where("id = ?", c.Param("id")).First(&config).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, util.Err(UserPayConfigNotFound))
		} else {
			c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		}
		return
	}

	// 更新配置
	if err := db.DB(c.Request.Context()).
		Model(&config).
		Updates(map[string]interface{}{
			"min_score":       req.MinScore,
			"max_score":       req.MaxScore,
			"fee_rate":        req.FeeRate,
			"score_rate":      req.ScoreRate,
			"daily_limit":     req.DailyLimit,
			"distribute_rate": req.DistributeRate,
		}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}

// DeleteUserPayConfig 删除支付配置
// @Tags admin
// @Produce json
// @Param id path string true "配置ID"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/admin/user-pay-configs/{id} [delete]
func DeleteUserPayConfig(c *gin.Context) {
	// 检查配置是否存在
	var config model.UserPayConfig
	if err := db.DB(c.Request.Context()).Where("id = ?", c.Param("id")).First(&config).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, util.Err(UserPayConfigNotFound))
		} else {
			c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		}
		return
	}

	if err := db.DB(c.Request.Context()).Delete(&config).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}
