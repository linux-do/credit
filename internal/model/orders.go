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

package model

import (
	"context"
	"fmt"
	"time"

	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/db/idgen"
	"github.com/linux-do/credit/internal/logger"
	"github.com/shopspring/decimal"

	"gorm.io/gorm"
)

type OrderType string

const (
	OrderTypeReceive            OrderType = "receive"
	OrderTypePayment            OrderType = "payment"
	OrderTypeTransfer           OrderType = "transfer"
	OrderTypeCommunity          OrderType = "community"
	OrderTypeOnline             OrderType = "online"
	OrderTypeTest               OrderType = "test"
	OrderTypeDistribute         OrderType = "distribute"
	OrderTypeRedEnvelopeSend    OrderType = "red_envelope_send"
	OrderTypeRedEnvelopeReceive OrderType = "red_envelope_receive"
	OrderTypeRedEnvelopeRefund  OrderType = "red_envelope_refund"
)

type OrderStatus string

const (
	OrderStatusSuccess   OrderStatus = "success"
	OrderStatusFailed    OrderStatus = "failed"
	OrderStatusPending   OrderStatus = "pending"
	OrderStatusExpired   OrderStatus = "expired"
	OrderStatusDisputing OrderStatus = "disputing"
	OrderStatusRefund    OrderStatus = "refund"
	OrderStatusRefused   OrderStatus = "refused"
)

type Order struct {
	ID              uint64          `json:"id,string" gorm:"primaryKey"`
	OrderNo         string          `json:"order_no" gorm:"-"`
	OrderName       string          `json:"order_name" gorm:"size:64;not null;index"`
	MerchantOrderNo string          `json:"merchant_order_no" gorm:"size:64;index"`
	ClientID        string          `json:"client_id" gorm:"size:64;index:idx_orders_client_status_created,priority:1;index:idx_orders_client_payee,priority:1;index:idx_orders_client_payer,priority:1"`
	PayerUserID     uint64          `json:"payer_user_id" gorm:"index:idx_orders_payer_status_type_created,priority:1;index:idx_orders_payer_status_type_trade,priority:1;index:idx_orders_client_payer,priority:2"`
	PayeeUserID     uint64          `json:"payee_user_id" gorm:"index:idx_orders_payee_status_type_created,priority:1;index:idx_orders_client_payee,priority:2"`
	PayerUsername   string          `json:"payer_username" gorm:"-:migration;->"`
	PayeeUsername   string          `json:"payee_username" gorm:"-:migration;->"`
	Amount          decimal.Decimal `json:"amount" gorm:"type:numeric(20,2);not null;index"`
	Status          OrderStatus     `json:"status" gorm:"type:varchar(20);not null;index:idx_orders_payee_status_type_created,priority:2;index:idx_orders_payer_status_type_created,priority:2;index:idx_orders_client_status_created,priority:2;index:idx_orders_payer_status_type_trade,priority:2;index:idx_orders_payment_link_status,priority:2"`
	Type            OrderType       `json:"type" gorm:"type:varchar(20);not null;index:idx_orders_payee_status_type_created,priority:3;index:idx_orders_payer_status_type_created,priority:3;index:idx_orders_payer_status_type_trade,priority:3"`
	Remark          string          `json:"remark" gorm:"size:255"`
	PaymentType     string          `json:"payment_type" gorm:"size:20"`
	PaymentLinkID   *uint64         `json:"payment_link_id,string" gorm:"index:idx_orders_payment_link_status,priority:1"`
	TradeTime       time.Time       `json:"trade_time" gorm:"index:idx_orders_payer_status_type_trade,priority:4"`
	ExpiresAt       time.Time       `json:"expires_at" gorm:"not null"`
	CreatedAt       time.Time       `json:"created_at" gorm:"autoCreateTime;index:idx_orders_payee_status_type_created,priority:4;index:idx_orders_payer_status_type_created,priority:4;index:idx_orders_client_status_created,priority:3"`
	UpdatedAt       time.Time       `json:"updated_at" gorm:"autoUpdateTime;index"`
}

func (o *Order) BeforeCreate(*gorm.DB) error {
	if o.ID == 0 {
		o.ID = idgen.NextUint64ID()
	}
	return nil
}

// AfterFind 格式化 OrderNo
func (o *Order) AfterFind(*gorm.DB) error {
	o.OrderNo = fmt.Sprintf("%018d", o.ID)
	return nil
}

// ExpirePendingOrders 将已过期且 pending 状态的订单设置为 expired
func ExpirePendingOrders(ctx context.Context) {
	result := db.DB(ctx).Model(&Order{}).
		Where("status = ? AND expires_at <= ?", OrderStatusPending, time.Now()).
		Update("status", OrderStatusExpired)

	if result.Error != nil {
		logger.ErrorF(ctx, "过期 pending 订单失败: %v", result.Error)
	} else {
		logger.InfoF(ctx, "已将 %d 个已过期的 pending 订单设置为 expired", result.RowsAffected)
	}
}
