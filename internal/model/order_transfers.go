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
	"time"

	"github.com/linux-do/credit/internal/db"
	"github.com/shopspring/decimal"
)

type OrderTransferStatus string

const (
	OrderTransferStatusPending   OrderTransferStatus = "pending"
	OrderTransferStatusCompleted OrderTransferStatus = "completed"
)

type OrderTransfer struct {
	ID          uint64              `json:"id,string" gorm:"primaryKey;autoIncrement"`
	OrderID     uint64              `json:"order_id,string" gorm:"index;uniqueIndex:uk_order_id"`
	PayeeUserID uint64              `json:"payee_user_id" gorm:"index"`
	Amount      decimal.Decimal     `json:"amount" gorm:"type:numeric(20,2);not null"`
	Status      OrderTransferStatus `json:"status" gorm:"type:varchar(20);not null;index:idx_status_transfer_at,priority:1"`
	TransferAt  time.Time           `json:"transfer_at" gorm:"not null;index:idx_status_transfer_at,priority:2"`
	CreatedAt   time.Time           `json:"created_at" gorm:"autoCreateTime;index"`
	UpdatedAt   time.Time           `json:"updated_at" gorm:"autoUpdateTime;index"`
}

func GetDueTransferOrders(ctx context.Context, limit int) ([]OrderTransfer, error) {
	var transfers []OrderTransfer
	if err := db.DB(ctx).
		Where("status = ? AND transfer_at <= ?", OrderTransferStatusPending, time.Now()).
		Order("status, transfer_at ASC").
		Limit(limit).
		Find(&transfers).Error; err != nil {
		return nil, err
	}
	return transfers, nil
}
