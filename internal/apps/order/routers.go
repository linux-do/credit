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

package order

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
)

type TransactionListRequest struct {
	Page          int        `json:"page" form:"page" binding:"min=1"`
	PageSize      int        `json:"page_size" form:"page_size" binding:"min=1,max=100"`
	Type          string     `json:"type" form:"type" binding:"omitempty,oneof=receive payment transfer community online test distribute red_envelope_send red_envelope_receive red_envelope_refund"`
	Status        string     `json:"status" form:"status" binding:"omitempty,oneof=success pending failed expired disputing refund refused"`
	ClientID      string     `json:"client_id" form:"client_id" binding:"omitempty"`
	StartTime     *time.Time `json:"startTime" form:"startTime" binding:"omitempty"`
	EndTime       *time.Time `json:"endTime" form:"endTime" binding:"omitempty,gtfield=StartTime"`
	ID            *uint64    `json:"id,string" form:"id" binding:"omitempty"`
	OrderName     string     `json:"order_name" form:"order_name" binding:"omitempty"`
	PayerUsername string     `json:"payer_username" form:"payer_username" binding:"omitempty"`
	PayeeUsername string     `json:"payee_username" form:"payee_username" binding:"omitempty"`
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
		DisputeID      *uint64 `json:"dispute_id,string"`
		PayerUsername  string  `json:"payer_username"`
		PayeeUsername  string  `json:"payee_username"`
		PayerAvatarURL string  `json:"payer_avatar_url"`
		PayeeAvatarURL string  `json:"payee_avatar_url"`
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
		Select("orders.*, merchant_api_keys.app_name, merchant_api_keys.app_homepage_url, merchant_api_keys.app_description, merchant_api_keys.redirect_uri, disputes.id as dispute_id, payer_user.username as payer_username, payee_user.username as payee_username, payer_user.avatar_url as payer_avatar_url, payee_user.avatar_url as payee_avatar_url").
		Joins("LEFT JOIN merchant_api_keys ON orders.client_id = merchant_api_keys.client_id").
		Joins("LEFT JOIN disputes ON orders.id = disputes.order_id").
		Joins("LEFT JOIN users as payer_user ON orders.payer_user_id = payer_user.id").
		Joins("LEFT JOIN users as payee_user ON orders.payee_user_id = payee_user.id")

	clientIDHandled := false
	if req.Type != "" {
		orderType := model.OrderType(req.Type)

		switch orderType {
		case model.OrderTypeReceive:
			// receive 类型：查询当前用户作为收款方的 payment 订单
			baseQuery = baseQuery.Where("orders.type = ? AND orders.payee_user_id = ?", model.OrderTypePayment, user.ID)
		case model.OrderTypeCommunity, model.OrderTypeRedEnvelopeRefund:
			// community、red_envelope_refund 类型：查询当前用户作为收款方的订单
			baseQuery = baseQuery.Where("orders.type = ? AND orders.payee_user_id = ?", orderType, user.ID)
		case model.OrderTypeRedEnvelopeReceive:
			// red_envelope_receive 类型：查询当前用户作为付款方或收款方的订单
			baseQuery = baseQuery.Where("orders.type = ? AND (orders.payer_user_id = ? OR orders.payee_user_id = ?)", orderType, user.ID, user.ID)
		case model.OrderTypeOnline:
			// online 类型：商家可查看自己 client_id 的所有订单，普通用户只能查看与自己相关的订单
			if req.ClientID != "" {
				clientIDHandled = true
				var count int64
				if err := db.DB(c.Request.Context()).Model(&model.MerchantAPIKey{}).
					Where("client_id = ? AND user_id = ?", req.ClientID, user.ID).
					Count(&count).Error; err != nil {
					c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
					return
				}
				if count > 0 {
					baseQuery = baseQuery.Where("orders.type = ? AND orders.client_id = ?", orderType, req.ClientID)
				} else {
					baseQuery = baseQuery.Where("orders.type = ? AND orders.client_id = ? AND (orders.payer_user_id = ? OR orders.payee_user_id = ?)", orderType, req.ClientID, user.ID, user.ID)
				}
			} else {
				baseQuery = baseQuery.Where("orders.type = ? AND (orders.payer_user_id = ? OR orders.payee_user_id = ?)", orderType, user.ID, user.ID)
			}
		case model.OrderTypePayment, model.OrderTypeTransfer, model.OrderTypeTest, model.OrderTypeDistribute, model.OrderTypeRedEnvelopeSend:
			// payment、transfer、test、distribute、red_envelope_send 类型：查询当前用户作为付款方的订单
			baseQuery = baseQuery.Where("orders.type = ? AND orders.payer_user_id = ?", orderType, user.ID)
		}
	} else {
		baseQuery = baseQuery.Where("orders.payee_user_id = ? OR orders.payer_user_id = ?", user.ID, user.ID)
	}

	if req.Status != "" {
		baseQuery = baseQuery.Where("orders.status = ?", model.OrderStatus(req.Status))
	}

	if req.ClientID != "" && !clientIDHandled {
		baseQuery = baseQuery.Where("orders.client_id = ?", req.ClientID)
	}
	if req.ID != nil {
		baseQuery = baseQuery.Where("orders.id = ?", req.ID)
	}
	if req.OrderName != "" {
		baseQuery = baseQuery.Where("orders.order_name LIKE ?", req.OrderName+"%")
	}
	if req.PayerUsername != "" {
		baseQuery = baseQuery.Where("payer_user.username LIKE ?", req.PayerUsername+"%")
	}
	if req.PayeeUsername != "" {
		baseQuery = baseQuery.Where("payee_user.username LIKE ?", req.PayeeUsername+"%")
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
