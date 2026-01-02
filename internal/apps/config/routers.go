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

package config

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
	"github.com/shopspring/decimal"
)

// PublicConfigResponse 公共配置响应
type PublicConfigResponse struct {
	DisputeTimeWindowHours int             `json:"dispute_time_window_hours"` // 争议时间窗口（小时）
	RedEnvelopeEnabled     int             `json:"red_envelope_enabled"`      // 红包功能是否启用（1启用，0禁用）
	RedEnvelopeMaxAmount   decimal.Decimal `json:"red_envelope_max_amount"`   // 单个红包的最大积分上限
	RedEnvelopeDailyLimit  int             `json:"red_envelope_daily_limit"`  // 每日发红包的个数限制
	RedEnvelopeFeeRate     decimal.Decimal `json:"red_envelope_fee_rate"`     // 红包手续费率
}

// GetPublicConfig 获取公共配置
// @Tags config
// @Accept json
// @Produce json
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/config/public [get]
func GetPublicConfig(c *gin.Context) {
	// 获取争议时间窗口配置
	disputeTimeHours, err := model.GetIntByKey(c.Request.Context(), model.ConfigKeyDisputeTimeWindowHours)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	// 获取红包功能启用状态
	redEnvelopeEnabled, err := model.GetIntByKey(c.Request.Context(), model.ConfigKeyRedEnvelopeEnabled)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	// 获取红包配置
	redEnvelopeMaxAmount, err := model.GetDecimalByKey(c.Request.Context(), model.ConfigKeyRedEnvelopeMaxAmount, 2)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	redEnvelopeDailyLimit, err := model.GetIntByKey(c.Request.Context(), model.ConfigKeyRedEnvelopeDailyLimit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	redEnvelopeFeeRate, err := model.GetDecimalByKey(c.Request.Context(), model.ConfigKeyRedEnvelopeFeeRate, 2)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	response := PublicConfigResponse{
		DisputeTimeWindowHours: disputeTimeHours,
		RedEnvelopeEnabled:     redEnvelopeEnabled,
		RedEnvelopeMaxAmount:   redEnvelopeMaxAmount,
		RedEnvelopeDailyLimit:  redEnvelopeDailyLimit,
		RedEnvelopeFeeRate:     redEnvelopeFeeRate,
	}

	c.JSON(http.StatusOK, util.OK(response))
}
