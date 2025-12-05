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
	"github.com/linux-do/pay/internal/util"
)

type TransactionListRequest struct {
	Page      int        `json:"page" form:"page" binding:"min=1"`
	PageSize  int        `json:"page_size" form:"page_size" binding:"min=1,max=100"`
	Type      string     `json:"type" form:"type" binding:"omitempty,oneof=receive payment transfer community"`
	Status    string     `json:"status" form:"status" binding:"omitempty,oneof=success pending failed expired disputing refund refused"`
	ClientID  string     `json:"client_id" form:"client_id" binding:"omitempty"`
	StartTime *time.Time `json:"startTime" form:"startTime" binding:"omitempty"`
	EndTime   *time.Time `json:"endTime" form:"endTime" binding:"omitempty,gtfield=StartTime"`
}

type TransactionListResponse struct {
	Total    int64 `json:"total"`
	Page     int   `json:"page"`
	PageSize int   `json:"page_size"`
	Orders   []struct {
		model.Order
		AppName        string  `json:"app_name"`
		AppHomepageURL string  `json:"app_homepage_url"`
		AppDescription string  `json:"app_description"`
		RedirectURI    string  `json:"redirect_uri"`
		DisputeID      *uint64 `json:"dispute_id"`
		PayerUsername  string  `json:"payer_username"`
		PayeeUsername  string  `json:"payee_username"`
	} `json:"orders"`
}

// ListTransactions 获取交易列表
// @Tags order
// @Accept json
// @Produce json
// @Param request body TransactionListRequest false "request body"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/order/transactions [post]
func ListTransactions(c *gin.Context) {
	var req TransactionListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	user, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	baseQuery := db.DB(c.Request.Context()).Model(&model.Order{}).
		Select("orders.*, merchant_api_keys.app_name, merchant_api_keys.app_homepage_url, merchant_api_keys.app_description, merchant_api_keys.redirect_uri, disputes.id as dispute_id, payer_user.username as payer_username, payee_user.username as payee_username").
		Joins("LEFT JOIN merchant_api_keys ON orders.client_id = merchant_api_keys.client_id").
		Joins("LEFT JOIN disputes ON orders.id = disputes.order_id").
		Joins("LEFT JOIN users as payer_user ON orders.payer_user_id = payer_user.id").
		Joins("LEFT JOIN users as payee_user ON orders.payee_user_id = payee_user.id")

	if req.Type != "" {
		orderType := model.OrderType(req.Type)

		switch orderType {
		case model.OrderTypeReceive:
			// receive 类型：查询当前用户作为收款方的 payment 订单
			baseQuery = baseQuery.Where("orders.type = ? AND orders.payee_user_id = ?", model.OrderTypePayment, user.ID)
		case model.OrderTypeCommunity:
			// community 类型：查询当前用户作为收款方的 community 订单
			baseQuery = baseQuery.Where("orders.type = ? AND orders.payee_user_id = ?", orderType, user.ID)
		case model.OrderTypePayment, model.OrderTypeTransfer:
			// payment 和 transfer 类型：查询当前用户作为付款方的订单
			baseQuery = baseQuery.Where("orders.type = ? AND orders.payer_user_id = ?", orderType, user.ID)
		}
	} else {
		baseQuery = baseQuery.Where("orders.payee_user_id = ? OR orders.payer_user_id = ?", user.ID, user.ID)
	}

	if req.Status != "" {
		baseQuery = baseQuery.Where("orders.status = ?", model.OrderStatus(req.Status))
	}

	if req.ClientID != "" {
		baseQuery = baseQuery.Where("orders.client_id = ?", req.ClientID)
	}
	if req.StartTime != nil {
		baseQuery = baseQuery.Where("orders.created_at >= ?", req.StartTime)
	}
	if req.EndTime != nil {
		baseQuery = baseQuery.Where("orders.created_at <= ?", req.EndTime)
	}

	var total int64
	if err := baseQuery.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	response := &TransactionListResponse{
		Total:    total,
		Page:     req.Page,
		PageSize: req.PageSize,
	}

	offset := (req.Page - 1) * req.PageSize
	if err := baseQuery.Order("orders.created_at DESC").Offset(offset).Limit(req.PageSize).Find(&response.Orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	// 转换订单类型：从收款方视角看，payment 订单应该显示为 receive
	for i := range response.Orders {
		if response.Orders[i].Type == model.OrderTypePayment && response.Orders[i].PayeeUserID == user.ID {
			response.Orders[i].Type = model.OrderTypeReceive
		}
	}

	c.JSON(http.StatusOK, util.OK(response))
}
