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

package dispute

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ListDisputesRequest 查询争议列表请求
type ListDisputesRequest struct {
	Page      int     `json:"page" form:"page" binding:"min=1"`
	PageSize  int     `json:"page_size" form:"page_size" binding:"min=1,max=100"`
	Status    string  `json:"status" form:"status" binding:"omitempty,oneof=disputing refund closed"`
	DisputeID *uint64 `json:"dispute_id,string" form:"dispute_id" binding:"omitempty"`
}

// ListDisputesResponse 查询争议列表响应
type ListDisputesResponse struct {
	Total    int64 `json:"total"`
	Page     int   `json:"page"`
	PageSize int   `json:"page_size"`
	Disputes []struct {
		model.Dispute
		OrderName     string          `json:"order_name"`
		PayeeUsername string          `json:"payee_username"`
		Amount        decimal.Decimal `json:"amount"`
	} `json:"disputes"`
}

// ListDisputes 查询当前用户作为发起者的争议订单
// @Tags order
// @Accept json
// @Produce json
// @Param request body ListDisputesRequest false "request body"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/order/disputes [post]
func ListDisputes(c *gin.Context) {
	var req ListDisputesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	user, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	baseQuery := db.DB(c.Request.Context()).Model(&model.Dispute{}).
		Select("disputes.*, orders.order_name, payee_user.username as payee_username, orders.amount, initiator_user.username as initiator_username, handler_user.username as handler_username").
		Joins("JOIN orders ON disputes.order_id = orders.id").
		Joins("JOIN users as payee_user ON orders.payee_user_id = payee_user.id").
		Joins("JOIN users as initiator_user ON disputes.initiator_user_id = initiator_user.id").
		Joins("LEFT JOIN users as handler_user ON disputes.handler_user_id = handler_user.id").
		Where("disputes.initiator_user_id = ?", user.ID)

	if req.Status != "" {
		baseQuery = baseQuery.Where("disputes.status = ?", model.DisputeStatus(req.Status))
	}
	if req.DisputeID != nil {
		baseQuery = baseQuery.Where("disputes.id = ?", req.DisputeID)
	}

	var total int64
	if err := baseQuery.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	response := &ListDisputesResponse{
		Total:    total,
		Page:     req.Page,
		PageSize: req.PageSize,
	}

	offset := (req.Page - 1) * req.PageSize
	if err := baseQuery.Order("disputes.created_at DESC").Offset(offset).Limit(req.PageSize).Find(&response.Disputes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(response))
}

// ListMerchantDisputes 查询当前用户作为商家的争议订单
// @Tags order
// @Accept json
// @Produce json
// @Param request body ListDisputesRequest false "request body"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/order/disputes/merchant [post]
func ListMerchantDisputes(c *gin.Context) {
	var req ListDisputesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	user, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	baseQuery := db.DB(c.Request.Context()).Model(&model.Dispute{}).
		Select("disputes.*, orders.order_name, payee_user.username as payee_username, orders.amount, initiator_user.username as initiator_username, handler_user.username as handler_username").
		Joins("JOIN orders ON disputes.order_id = orders.id").
		Joins("JOIN users as payee_user ON orders.payee_user_id = payee_user.id").
		Joins("JOIN users as initiator_user ON disputes.initiator_user_id = initiator_user.id").
		Joins("LEFT JOIN users as handler_user ON disputes.handler_user_id = handler_user.id").
		Where("orders.payee_user_id = ?", user.ID)

	if req.Status != "" {
		baseQuery = baseQuery.Where("disputes.status = ?", model.DisputeStatus(req.Status))
	}
	if req.DisputeID != nil {
		baseQuery = baseQuery.Where("disputes.id = ?", req.DisputeID)
	}

	var total int64
	if err := baseQuery.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	response := &ListDisputesResponse{
		Total:    total,
		Page:     req.Page,
		PageSize: req.PageSize,
	}

	offset := (req.Page - 1) * req.PageSize
	if err := baseQuery.Order("disputes.created_at DESC").Offset(offset).Limit(req.PageSize).Find(&response.Disputes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(response))
}

// CreateDisputeRequest 发起争议请求
type CreateDisputeRequest struct {
	OrderID uint64 `json:"order_id,string" binding:"required"`
	Reason  string `json:"reason" binding:"required,max=100"`
}

// CreateDispute 发起争议
// @Tags order
// @Accept json
// @Produce json
// @Param request body CreateDisputeRequest true "request body"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/order/dispute [post]
func CreateDispute(c *gin.Context) {
	var req CreateDisputeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	user, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	// 获取争议时间窗口配置（小时）
	disputeTimeHours, errKey := model.GetIntByKey(c.Request.Context(), model.ConfigKeyDisputeTimeWindowHours)
	if errKey != nil {
		c.JSON(http.StatusInternalServerError, util.Err(errKey.Error()))
		return
	}

	dispute := model.Dispute{
		OrderID:         req.OrderID,
		InitiatorUserID: user.ID,
		Reason:          req.Reason,
		Status:          model.DisputeStatusDisputing,
	}

	if err := db.DB(c.Request.Context()).Transaction(
		func(tx *gorm.DB) error {
			var order model.Order
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "NOWAIT"}).
				Where("id = ? AND payer_user_id = ? AND status = ? AND type IN ?", req.OrderID, user.ID, model.OrderStatusSuccess, []model.OrderType{model.OrderTypePayment, model.OrderTypeOnline}).
				First(&order).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return errors.New(OrderNotFoundForDispute)
				}
				return err
			}

			// 检查是否在争议时间窗口内
			// 订单支付时间 + 争议时间窗口 <= 当前时间，则无法发起争议
			disputeDeadline := order.TradeTime.Add(time.Duration(disputeTimeHours) * time.Hour)
			if time.Now().After(disputeDeadline) {
				return errors.New(DisputeTimeWindowExpired)
			}

			if err := tx.Create(&dispute).Error; err != nil {
				return err
			}

			// 更新订单状态为争议中
			if err := tx.Model(&order).Update("status", model.OrderStatusDisputing).Error; err != nil {
				return err
			}

			return nil
		},
	); err != nil {
		errMsg := err.Error()
		if errMsg == OrderNotFoundForDispute {
			c.JSON(http.StatusNotFound, util.Err(OrderNotFoundForDispute))
		} else if errMsg == DisputeTimeWindowExpired {
			c.JSON(http.StatusBadRequest, util.Err(DisputeTimeWindowExpired))
		} else if strings.Contains(errMsg, "SQLSTATE 23505") {
			c.JSON(http.StatusBadRequest, util.Err(DuplicateDispute))
		} else {
			c.JSON(http.StatusInternalServerError, util.Err(errMsg))
		}
		return
	}

	c.JSON(http.StatusOK, util.OK(dispute))
}

// RefundReviewRequest 退款审核请求
type RefundReviewRequest struct {
	DisputeID uint64 `json:"dispute_id,string" binding:"required"`
	Status    string `json:"status" binding:"required,oneof=refund closed"`
	Reason    string `json:"reason" binding:"omitempty,max=100"`
}

// RefundReview 退款审核（同意/拒绝）
// @Tags order
// @Accept json
// @Produce json
// @Param request body RefundReviewRequest true "request body"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/order/refund-review [post]
func RefundReview(c *gin.Context) {
	var req RefundReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}
	status := model.DisputeStatus(req.Status)

	if status == model.DisputeStatusClosed && req.Reason == "" {
		c.JSON(http.StatusBadRequest, util.Err(ReasonRequiredForRefusal))
		return
	}

	merchantUser, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	if err := db.DB(c.Request.Context()).Transaction(
		func(tx *gorm.DB) error {
			var dispute model.Dispute
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "NOWAIT"}).
				Where("id = ? AND status = ?", req.DisputeID, model.DisputeStatusDisputing).
				First(&dispute).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return errors.New(DisputeNotFound)
				}
				return err
			}

			var order model.Order
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "NOWAIT"}).
				Where("id = ? AND payee_user_id = ? AND status = ? AND type IN ?", dispute.OrderID, merchantUser.ID, model.OrderStatusDisputing, []model.OrderType{model.OrderTypePayment, model.OrderTypeOnline}).
				First(&order).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return errors.New(NotOrderMerchant)
				}
				return err
			}

			if status == model.DisputeStatusRefund {
				var payerUser model.User
				if err := payerUser.GetByID(tx, order.PayerUserID); err != nil {
					return err
				}

				// 获取商家的支付配置
				var merchantPayConfig model.UserPayConfig
				if err := merchantPayConfig.GetByPayScore(tx, merchantUser.PayScore); err != nil {
					return err
				}

				merchantScoreDecrease := order.Amount.Mul(merchantPayConfig.ScoreRate).Round(0).IntPart()
				if err := tx.Model(&model.User{}).
					Where("id = ?", merchantUser.ID).
					UpdateColumns(map[string]interface{}{
						"available_balance": gorm.Expr("available_balance - ?", order.Amount),
						"total_receive":     gorm.Expr("total_receive - ?", order.Amount),
						"pay_score":         gorm.Expr("pay_score - ?", merchantScoreDecrease),
					}).Error; err != nil {
					return err
				}

				if err := tx.Model(&model.User{}).
					Where("id = ?", payerUser.ID).
					UpdateColumns(map[string]interface{}{
						"available_balance": gorm.Expr("available_balance + ?", order.Amount),
						"total_payment":     gorm.Expr("total_payment - ?", order.Amount),
						"pay_score":         gorm.Expr("pay_score - ?", order.Amount.Round(0).IntPart()),
					}).Error; err != nil {
					return err
				}

				if err := tx.Model(&model.Dispute{}).
					Where("id = ?", dispute.ID).
					Updates(map[string]interface{}{
						"status":          model.DisputeStatusRefund,
						"handler_user_id": merchantUser.ID,
					}).Error; err != nil {
					return err
				}

				if err := tx.Model(&model.Order{}).
					Where("id = ?", order.ID).
					Update("status", model.OrderStatusRefund).Error; err != nil {
					return err
				}
			} else if status == model.DisputeStatusClosed {
				updateData := map[string]interface{}{
					"status":          model.DisputeStatusClosed,
					"handler_user_id": merchantUser.ID,
					"reason":          dispute.Reason + " [受托方拒绝理由: " + req.Reason + "]",
				}

				if err := tx.Model(&model.Dispute{}).
					Where("id = ?", dispute.ID).
					Updates(updateData).Error; err != nil {
					return err
				}

				if err := tx.Model(&model.Order{}).
					Where("id = ?", order.ID).
					Update("status", model.OrderStatusRefused).Error; err != nil {
					return err
				}
			}

			return nil
		},
	); err != nil {
		errMsg := err.Error()
		if errMsg == DisputeNotFound {
			c.JSON(http.StatusNotFound, util.Err(DisputeNotFound))
		} else {
			c.JSON(http.StatusInternalServerError, util.Err(errMsg))
		}
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}

// CloseDisputeRequest 关闭争议请求
type CloseDisputeRequest struct {
	DisputeID uint64 `json:"dispute_id,string" binding:"required"`
}

// CloseDispute 用户主动关闭争议（只能由发起者关闭）
// @Tags order
// @Accept json
// @Produce json
// @Param request body CloseDisputeRequest true "request body"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/order/dispute/close [post]
func CloseDispute(c *gin.Context) {
	var req CloseDisputeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	user, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	if err := db.DB(c.Request.Context()).Transaction(
		func(tx *gorm.DB) error {
			var dispute model.Dispute
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "NOWAIT"}).
				Where("id = ? AND initiator_user_id = ? AND status = ?", req.DisputeID, user.ID, model.DisputeStatusDisputing).
				First(&dispute).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return errors.New(DisputeNotFound)
				}
				return err
			}

			var order model.Order
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "NOWAIT"}).
				Where("id = ? AND status = ? AND type IN ?", dispute.OrderID, model.OrderStatusDisputing, []model.OrderType{model.OrderTypePayment, model.OrderTypeOnline}).
				First(&order).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return errors.New(OrderNotFoundForDispute)
				}
				return err
			}

			if err := tx.Model(&model.Dispute{}).
				Where("id = ?", dispute.ID).
				Updates(map[string]interface{}{
					"status":          model.DisputeStatusClosed,
					"handler_user_id": user.ID,
				}).Error; err != nil {
				return err
			}

			if err := tx.Model(&model.Order{}).
				Where("id = ?", order.ID).
				Update("status", model.OrderStatusSuccess).Error; err != nil {
				return err
			}

			return nil
		},
	); err != nil {
		errMsg := err.Error()
		if errMsg == DisputeNotFound {
			c.JSON(http.StatusNotFound, util.Err(DisputeNotFound))
		} else if errMsg == OrderNotFoundForDispute {
			c.JSON(http.StatusNotFound, util.Err(OrderNotFoundForDispute))
		} else {
			c.JSON(http.StatusInternalServerError, util.Err(errMsg))
		}
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}
