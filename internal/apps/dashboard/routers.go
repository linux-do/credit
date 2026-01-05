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

package dashboard

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
	"github.com/shopspring/decimal"
)

// DailyStatsRequest 每日统计请求参数
type DailyStatsRequest struct {
	Days int `form:"days" binding:"required,min=1,max=7"`
}

// DailyStatsItem 每日统计项
type DailyStatsItem struct {
	Date    string          `json:"date"`
	Income  decimal.Decimal `json:"income"`
	Expense decimal.Decimal `json:"expense"`
}

// TopCustomersRequest Top客户请求参数
type TopCustomersRequest struct {
	Days  int `form:"days" binding:"required,min=1,max=7"`
	Limit int `form:"limit" binding:"required,min=1,max=10"`
}

// TopCustomer Top客户项
type TopCustomer struct {
	UserID      uint64          `json:"user_id"`
	Username    string          `json:"username"`
	TotalAmount decimal.Decimal `json:"total_amount"`
	OrderCount  int64           `json:"order_count"`
}

// GetDailyStats 获取每日收支统计
// @Summary 获取每日收支统计
// @Tags dashboard
// @Accept json
// @Produce json
// @Param days query int true "查询天数，最大7天"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/dashboard/stats/daily [get]
func GetDailyStats(c *gin.Context) {
	var req DailyStatsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	user, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)
	ctx := c.Request.Context()
	startDate, endDate := getDateRange(req.Days)

	// 查询每日收入（用户作为收款方）
	incomeStats, err := queryDailyAmounts(ctx, user.ID, true, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	// 查询每日支出（用户作为付款方）
	expenseStats, err := queryDailyAmounts(ctx, user.ID, false, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	dailyStats := mergeDailyStats(startDate, req.Days, incomeStats, expenseStats)

	c.JSON(http.StatusOK, util.OK(dailyStats))
}

// GetTopCustomers 获取Top客户（向当前用户付款最多的客户）
// @Summary 获取Top客户
// @Tags dashboard
// @Accept json
// @Produce json
// @Param days query int true "查询天数，最大7天"
// @Param limit query int true "返回数量，最大10"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/dashboard/stats/top-customers [get]
func GetTopCustomers(c *gin.Context) {
	var req TopCustomersRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	user, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)
	ctx := c.Request.Context()
	startDate, endDate := getDateRange(req.Days)

	// 查询Top客户
	var customers []TopCustomer
	err := db.DB(ctx).Model(&model.Order{}).
		Select(`
			orders.payer_user_id as user_id,
			users.username,
			SUM(orders.amount) as total_amount,
			COUNT(*) as order_count
		`).
		Joins("LEFT JOIN users ON orders.payer_user_id = users.id").
		Where("orders.payee_user_id = ?", user.ID).
		Where("orders.status = ?", model.OrderStatusSuccess).
		Where("orders.type in ?", []model.OrderType{model.OrderTypePayment, model.OrderTypeOnline}).
		Where("orders.created_at >= ? AND orders.created_at < ?", startDate, endDate).
		Group("orders.payer_user_id, users.username").
		Order("total_amount DESC").
		Limit(req.Limit).
		Scan(&customers).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(customers))
}

// UserBalanceStatsResponse 用户余额统计响应
type UserBalanceStatsResponse struct {
	TotalCount   int64           `json:"total_count"`
	TotalAmount  decimal.Decimal `json:"total_amount"`
	AvgAmount    decimal.Decimal `json:"avg_amount"`
	MedianAmount decimal.Decimal `json:"median_amount"`
	MinAmount    decimal.Decimal `json:"min_amount"`
	MaxAmount    decimal.Decimal `json:"max_amount"`
	StdDev       decimal.Decimal `json:"std_dev"`
}

// GetUserBalanceStats 获取用户余额统计
// @Summary 获取用户余额统计
// @Description 统计所有用户的AvailableBalance字段
// @Tags dashboard
// @Accept json
// @Produce json
// @Success 200 {object} util.ResponseAny{data=UserBalanceStatsResponse}
// @Router /api/v1/dashboard/stats/user-balance [get]
func GetUserBalanceStats(c *gin.Context) {
	ctx := c.Request.Context()

	var cachedStats UserBalanceStatsResponse
	if err := db.GetJSON(ctx, dashboardCacheKeyPrefix, &cachedStats); err == nil {
		c.JSON(http.StatusOK, util.OK(cachedStats))
		return
	}

	stats, err := calculateUserBalanceStats(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err("查询用户余额统计失败: "+err.Error()))
		return
	}

	median, err := calculateMedian(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err("计算中位数失败: "+err.Error()))
		return
	}

	response := UserBalanceStatsResponse{
		TotalCount:   stats.TotalCount,
		TotalAmount:  stats.TotalAmount,
		AvgAmount:    stats.AvgAmount,
		MedianAmount: median,
		MinAmount:    stats.MinAmount,
		MaxAmount:    stats.MaxAmount,
		StdDev:       stats.StdDev,
	}

	if cacheTTL, errGet := model.GetIntByKey(ctx, model.ConfigKeyUserBalanceStatsCacheTTL); errGet == nil && cacheTTL > 0 {
		_ = db.SetJSON(ctx, dashboardCacheKeyPrefix, response, time.Duration(cacheTTL)*time.Second)
	}

	c.JSON(http.StatusOK, util.OK(response))
}
