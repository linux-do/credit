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

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
	"github.com/shopspring/decimal"
)

// ListRequest 排行榜列表请求
type ListRequest struct {
	Page     int `form:"page" binding:"required,min=1"`
	PageSize int `form:"page_size" binding:"required,min=1,max=50"`
}

// LeaderboardEntry 排行榜条目（rank 由前端根据 offset + index + 1 计算）
type LeaderboardEntry struct {
	UserID           uint64          `json:"user_id"`
	Username         string          `json:"username"`
	AvatarURL        string          `json:"avatar_url"`
	AvailableBalance decimal.Decimal `json:"available_balance"`
}

// ListResponse 排行榜列表响应
type ListResponse struct {
	SortBy   string             `json:"sort_by"`
	Order    string             `json:"order"`
	Page     int                `json:"page"`
	PageSize int                `json:"page_size"`
	Total    int64              `json:"total"`
	Items    []LeaderboardEntry `json:"items"`
}

// UserRankResponse 用户排名响应
type UserRankResponse struct {
	User UserRankInfo `json:"user"`
}

// UserRankInfo 用户排名信息
type UserRankInfo struct {
	UserID           uint64          `json:"user_id"`
	Rank             int             `json:"rank"`
	AvailableBalance decimal.Decimal `json:"available_balance"`
}

// List 获取排行榜列表
// @Summary 获取排行榜列表
// @Tags leaderboard
// @Accept json
// @Produce json
// @Param page query int true "页码"
// @Param page_size query int true "每页数量"
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
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/leaderboard/me [get]
func GetMyRank(c *gin.Context) {
	user, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)
	ctx := c.Request.Context()
	response, err := getUserRank(ctx, user.ID)
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
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/leaderboard/users/{id} [get]
func GetUserRankByID(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, util.Err("invalid user id"))
		return
	}

	ctx := c.Request.Context()
	response, err := getUserRank(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(response))
}
