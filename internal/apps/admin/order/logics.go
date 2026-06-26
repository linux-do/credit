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
	"context"
	"errors"

	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/service"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// listOrders 查询后台订单列表，并补充应用、争议、用户和延迟结算信息。
func listOrders(ctx context.Context, req *listOrdersRequest) (*listOrdersResponse, error) {
	query := db.DB(ctx).Model(&model.Order{})
	if len(req.Types) > 0 {
		query = query.Where("orders.type IN ?", req.Types)
	}
	if len(req.Statuses) > 0 {
		query = query.Where("orders.status IN ?", req.Statuses)
	}
	if req.ClientID != "" {
		query = query.Where("orders.client_id = ?", req.ClientID)
	}
	if req.MerchantOrderNo != "" {
		query = query.Where("orders.merchant_order_no = ?", req.MerchantOrderNo)
	}
	if req.ID != nil {
		query = query.Where("orders.id = ?", *req.ID)
	}
	if req.OrderName != "" {
		query = query.Where("orders.order_name LIKE ?", req.OrderName+"%")
	}
	if req.StartTime != nil {
		query = query.Where("orders.created_at >= ?", req.StartTime)
	}
	if req.EndTime != nil {
		query = query.Where("orders.created_at <= ?", req.EndTime)
	}

	var err error
	if query, err = applyOrderUsernameFilter(query, "orders.payer_user_id", req.PayerUsername); err != nil {
		return nil, err
	}
	if query, err = applyOrderUsernameFilter(query, "orders.payee_user_id", req.PayeeUsername); err != nil {
		return nil, err
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	response := &listOrdersResponse{
		Total:    total,
		Page:     req.Page,
		PageSize: req.PageSize,
	}

	offset := (req.Page - 1) * req.PageSize
	if err := query.
		Select("orders.*, merchant_api_keys.app_name, merchant_api_keys.app_homepage_url, merchant_api_keys.app_description, disputes.id as dispute_id, disputes.status as dispute_status, disputes.reason as dispute_reason, disputes.created_at as dispute_created_at, disputes.updated_at as dispute_updated_at, payer_user.username as payer_username, payee_user.username as payee_username, payer_user.avatar_url as payer_avatar_url, payee_user.avatar_url as payee_avatar_url, COALESCE(order_transfers.status, ?) as payee_transfer_status, order_transfers.transfer_at as payee_transfer_at", model.OrderTransferStatusCompleted).
		Joins("LEFT JOIN merchant_api_keys ON orders.client_id = merchant_api_keys.client_id").
		Joins("LEFT JOIN disputes ON orders.id = disputes.order_id").
		Joins("LEFT JOIN users as payer_user ON orders.payer_user_id = payer_user.id").
		Joins("LEFT JOIN users as payee_user ON orders.payee_user_id = payee_user.id").
		Joins("LEFT JOIN order_transfers ON orders.id = order_transfers.order_id").
		Order("orders.created_at DESC").
		Offset(offset).
		Limit(req.PageSize).
		Find(&response.Orders).Error; err != nil {
		return nil, err
	}

	return response, nil
}

// refundOrder 执行管理员退款；有争议时更新争议，无争议时只按需追加订单备注。
func refundOrder(ctx context.Context, id uint64, req *refundOrderRequest, adminUserID uint64) error {
	return db.DB(ctx).Transaction(func(tx *gorm.DB) error {
		var order model.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ? AND status IN ? AND type IN ?", id, []model.OrderStatus{
				model.OrderStatusSuccess,
				model.OrderStatusDisputing,
				model.OrderStatusRefused,
			}, []model.OrderType{model.OrderTypePayment, model.OrderTypeOnline}).
			First(&order).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New(orderNotRefundable)
			}
			return err
		}

		var merchantUser model.User
		if err := merchantUser.GetByID(tx, order.PayeeUserID); err != nil {
			return err
		}

		var merchantPayConfig model.UserPayConfig
		if err := merchantPayConfig.GetByPayScore(tx, merchantUser.PayScore); err != nil {
			return err
		}

		var dispute model.Dispute
		hasDispute := false
		// 存在争议时锁住争议记录，后续把管理员备注追加到争议原因；无争议才追加到订单备注。
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("order_id = ?", order.ID).First(&dispute).Error; err != nil {
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				return err
			}
		} else {
			hasDispute = true
			if dispute.Status == model.DisputeStatusRefund {
				return errors.New(orderNotRefundable)
			}
		}

		if err := service.RefundOrder(tx, &order, &merchantPayConfig); err != nil {
			return err
		}

		// 有争议时，管理员退款同时关闭争议；备注追加到争议原因，方便和双方争议对话一起查看。
		if hasDispute {
			updates := map[string]interface{}{
				"status":          model.DisputeStatusRefund,
				"handler_user_id": adminUserID,
			}
			if req.Remark != "" {
				reason, err := appendAdminRemark(dispute.Reason, req.Remark, disputeReasonMaxLength)
				if err != nil {
					return err
				}
				updates["reason"] = reason
			}
			return tx.Model(&model.Dispute{}).
				Where("id = ?", dispute.ID).
				Updates(updates).Error
		}

		// 普通订单没有争议记录，只有管理员填写备注时才落到订单备注。
		if req.Remark == "" {
			return nil
		}
		nextRemark, err := appendAdminRemark(order.Remark, req.Remark, orderRemarkMaxLength)
		if err != nil {
			return err
		}
		return tx.Model(&model.Order{}).
			Where("id = ?", order.ID).
			Update("remark", nextRemark).Error
	})
}
