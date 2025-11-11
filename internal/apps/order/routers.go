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

package order

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/pay/internal/apps/oauth"
	"github.com/linux-do/pay/internal/db"
	"github.com/linux-do/pay/internal/model"
	"github.com/linux-do/pay/internal/utils"
)

type TransactionListRequest struct {
	Page      int        `json:"page" form:"page" binding:"min=1"`
	PageSize  int        `json:"page_size" form:"page_size" binding:"min=1,max=100"`
	Type      string     `json:"type" form:"type" binding:"omitempty,oneof=receive payment transfer community"`
	Status    string     `json:"status" form:"status" binding:"omitempty,oneof=success pending failed disputing refund refunded"`
	StartTime *time.Time `json:"startTime" form:"startTime" binding:"omitempty"`
	EndTime   *time.Time `json:"endTime" form:"endTime" binding:"omitempty,gtfield=StartTime"`
}

type TransactionListResponse struct {
	Total    int64         `json:"total"`
	Page     int           `json:"page"`
	PageSize int           `json:"page_size"`
	Orders   []model.Order `json:"orders"`
}

// TransactionList
// @Tags order
// @Accept json
// @Produce json
// @Param request body TransactionListRequest false "request body"
// @Success 200 {object} utils.ResponseAny
// @Router /api/v1/order/transactions [post]
func TransactionList(c *gin.Context) {
	var req TransactionListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.Err(err.Error()))
		return
	}

	user, _ := oauth.GetUserFromContext(c)

	baseQuery := db.DB(c.Request.Context()).Model(&model.Order{}).
		Where("payee_username = ? OR payer_username = ?", user.Username, user.Username)

	if req.Status != "" {
		baseQuery = baseQuery.Where("status = ?", model.OrderStatus(req.Status))
	}
	if req.Type != "" {
		baseQuery = baseQuery.Where("type = ?", model.OrderType(req.Type))
	}
	if req.StartTime != nil {
		baseQuery = baseQuery.Where("created_at >= ?", req.StartTime)
	}
	if req.EndTime != nil {
		baseQuery = baseQuery.Where("created_at <= ?", req.EndTime)
	}

	var total int64
	if err := baseQuery.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Err(err.Error()))
		return
	}

	var orders []model.Order
	offset := (req.Page - 1) * req.PageSize
	if err := baseQuery.Order("created_at DESC").Offset(offset).Limit(req.PageSize).Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.OK(TransactionListResponse{
		Total:    total,
		Page:     req.Page,
		PageSize: req.PageSize,
		Orders:   orders,
	}))
}
