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
)

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
	response, err := GetList(ctx, &req)
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
	response, err := GetUserRank(ctx, user.ID, &req)
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
	response, err := GetUserRank(ctx, userID, &req)
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
	c.JSON(http.StatusOK, util.OK(GetMetadata()))
}
