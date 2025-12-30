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

package leaderboard

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
	"github.com/shopspring/decimal"
)

// ListRequest 排行榜列表请求
type ListRequest struct {
	Period   PeriodType `form:"period" binding:"omitempty,oneof=day week month all_time"`
	Date     string     `form:"date" binding:"omitempty"`
	Metric   MetricType `form:"metric" binding:"omitempty,oneof=receive_amount payment_amount transfer_in_amount transfer_out_amount volume_amount net_amount"`
	Page     int        `form:"page" binding:"omitempty,min=1"`
	PageSize int        `form:"page_size" binding:"omitempty,min=1,max=100"`
}

// LeaderboardEntry 排行榜条目
type LeaderboardEntry struct {
	Rank         int             `json:"rank"`
	UserID       uint64          `json:"user_id"`
	Username     string          `json:"username"`
	AvatarURL    string          `json:"avatar_url"`
	Score        decimal.Decimal `json:"score"`
	PreviousRank *int            `json:"previous_rank,omitempty"`
}

// LeaderboardPeriod 时间周期信息
type LeaderboardPeriod struct {
	Type      PeriodType `json:"type"`
	Start     string     `json:"start"`
	End       string     `json:"end"`
	StartTime time.Time  `json:"-"`
	EndTime   time.Time  `json:"-"`
}

// ListResponse 排行榜列表响应
type ListResponse struct {
	Period     LeaderboardPeriod  `json:"period"`
	Metric     MetricType         `json:"metric"`
	SnapshotAt string             `json:"snapshot_at"`
	Page       int                `json:"page"`
	PageSize   int                `json:"page_size"`
	Total      int64              `json:"total"`
	Items      []LeaderboardEntry `json:"items"`
}

// UserRankResponse 用户排名响应
type UserRankResponse struct {
	Period     LeaderboardPeriod `json:"period"`
	Metric     MetricType        `json:"metric"`
	SnapshotAt string            `json:"snapshot_at"`
	User       UserRankInfo      `json:"user"`
}

// UserRankInfo 用户排名信息
type UserRankInfo struct {
	UserID uint64          `json:"user_id"`
	Rank   int             `json:"rank"`
	Score  decimal.Decimal `json:"score"`
}

// MetricInfo 指标信息
type MetricInfo struct {
	Key  MetricType `json:"key"`
	Name string     `json:"name"`
}

// MetadataResponse 元数据响应
type MetadataResponse struct {
	Periods  []PeriodType `json:"periods"`
	Metrics  []MetricInfo `json:"metrics"`
	Timezone string       `json:"timezone"`
	Defaults struct {
		Period   PeriodType `json:"period"`
		Metric   MetricType `json:"metric"`
		PageSize int        `json:"page_size"`
	} `json:"defaults"`
}

// List 获取排行榜列表
// @Summary 获取排行榜列表
// @Tags leaderboard
// @Accept json
// @Produce json
// @Param period query string false "时间周期: day, week, month, all_time"
// @Param metric query string false "排行指标: receive_amount, payment_amount, volume_amount, net_amount"
// @Param page query int false "页码"
// @Param page_size query int false "每页数量"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/leaderboard [get]
func List(c *gin.Context) {
	var req ListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	ctx := c.Request.Context()
	response, err := getList(ctx, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(response))
}

// GetMyRank 获取当前用户排名
// @Summary 获取当前用户排名
// @Tags leaderboard
// @Accept json
// @Produce json
// @Param period query string false "时间周期"
// @Param metric query string false "排行指标"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/leaderboard/me [get]
func GetMyRank(c *gin.Context) {
	var req ListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	user, ok := util.GetFromContext[*model.User](c, oauth.UserObjKey)
	if !ok || user == nil {
		c.JSON(http.StatusUnauthorized, util.Err("unauthorized"))
		return
	}

	ctx := c.Request.Context()
	response, err := getUserRank(ctx, user.ID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(response))
}

// GetUserRankByID 获取指定用户排名
// @Summary 获取指定用户排名
// @Tags leaderboard
// @Accept json
// @Produce json
// @Param id path int true "用户ID"
// @Param period query string false "时间周期"
// @Param metric query string false "排行指标"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/leaderboard/users/{id} [get]
func GetUserRankByID(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, util.Err("invalid user id"))
		return
	}

	var req ListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	ctx := c.Request.Context()
	response, err := getUserRank(ctx, userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(response))
}

// Metadata 获取排行榜元数据
// @Summary 获取排行榜元数据
// @Tags leaderboard
// @Produce json
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/leaderboard/metadata [get]
func Metadata(c *gin.Context) {
	c.JSON(http.StatusOK, util.OK(getMetadata()))
}
