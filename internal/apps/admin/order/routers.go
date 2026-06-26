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
	"errors"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/service"
	"github.com/linux-do/credit/internal/util"
)

// listOrdersRequest 后台订单列表查询请求。
type listOrdersRequest struct {
	Page            int        `json:"page" binding:"min=1"`
	PageSize        int        `json:"page_size" binding:"min=1,max=100"`
	Types           []string   `json:"types" binding:"omitempty,dive,oneof=payment transfer community online test distribute red_envelope_send red_envelope_receive red_envelope_refund"`
	Statuses        []string   `json:"statuses" binding:"omitempty,dive,oneof=success pending failed expired disputing refund refused"`
	ClientID        string     `json:"client_id" binding:"omitempty,max=64"`
	MerchantOrderNo string     `json:"merchant_order_no" binding:"omitempty,max=64"`
	StartTime       *time.Time `json:"start_time" binding:"omitempty"`
	EndTime         *time.Time `json:"end_time" binding:"omitempty,gtfield=StartTime"`
	ID              *uint64    `json:"id,string" binding:"omitempty"`
	OrderName       string     `json:"order_name" binding:"omitempty,max=64"`
	PayerUsername   string     `json:"payer_username" binding:"omitempty,max=255"`
	PayeeUsername   string     `json:"payee_username" binding:"omitempty,max=255"`
}

// adminOrder 后台订单列表项，补充应用、争议、用户和延迟结算信息。
type adminOrder struct {
	model.Order
	AppName             string               `json:"app_name"`
	AppHomepageURL      string               `json:"app_homepage_url"`
	AppDescription      string               `json:"app_description"`
	DisputeID           *uint64              `json:"dispute_id,string"`
	DisputeStatus       *model.DisputeStatus `json:"dispute_status"`
	DisputeReason       string               `json:"dispute_reason"`
	DisputeCreatedAt    *time.Time           `json:"dispute_created_at"`
	DisputeUpdatedAt    *time.Time           `json:"dispute_updated_at"`
	PayerUsername       string               `json:"payer_username"`
	PayeeUsername       string               `json:"payee_username"`
	PayerAvatarURL      string               `json:"payer_avatar_url"`
	PayeeAvatarURL      string               `json:"payee_avatar_url"`
	PayeeTransferStatus string               `json:"payee_transfer_status"`
	PayeeTransferAt     *time.Time           `json:"payee_transfer_at"`
}

// listOrdersResponse 后台订单列表响应。
type listOrdersResponse struct {
	Orders   []adminOrder `json:"orders"`
	Total    int64        `json:"total"`
	Page     int          `json:"page"`
	PageSize int          `json:"page_size"`
}

// refundOrderRequest 后台退款请求。
type refundOrderRequest struct {
	ID     uint64 `uri:"id" json:"-" binding:"required,gt=0"`
	Remark string `json:"remark" binding:"omitempty,max=100"`
}

// ListOrders 获取后台订单列表
// @Tags admin
// @Accept json
// @Produce json
// @Param request body listOrdersRequest true "request body"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/admin/orders [post]
func ListOrders(c *gin.Context) {
	var req listOrdersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	response, err := listOrders(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(response))
}

// RefundOrder 管理员退款
// @Tags admin
// @Accept json
// @Produce json
// @Param id path int true "订单ID"
// @Param request body refundOrderRequest false "request body"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/admin/orders/{id}/refund [post]
func RefundOrder(c *gin.Context) {
	var req refundOrderRequest
	if err := c.ShouldBindUri(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}
	if err := c.ShouldBindJSON(&req); err != nil && !errors.Is(err, io.EOF) {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}
	req.Remark = strings.TrimSpace(req.Remark)

	adminUser, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	if err := refundOrder(c.Request.Context(), req.ID, &req, adminUser.ID); err != nil {
		switch err.Error() {
		case orderNotRefundable, service.RefundOrderStatusInvalid, service.RefundOrderTypeInvalid, remarkTooLong:
			c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		default:
			c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		}
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}
