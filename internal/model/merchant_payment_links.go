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
	"time"

	"github.com/linux-do/credit/internal/db/idgen"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type MerchantPaymentLink struct {
	ID               uint64          `json:"id,string" gorm:"primaryKey"`
	MerchantAPIKeyID uint64          `json:"merchant_api_key_id,string" gorm:"not null;index"`
	Token            string          `json:"token" gorm:"size:64;uniqueIndex;not null"`
	Amount           decimal.Decimal `json:"amount" gorm:"type:numeric(20,2);not null"`
	ProductName      string          `json:"product_name" gorm:"size:30;not null"`
	Remark           string          `json:"remark" gorm:"size:100"`
	TotalLimit       *uint           `json:"total_limit" gorm:"default:null"`
	UserLimit        *uint           `json:"user_limit" gorm:"default:null"`
	CreatedAt        time.Time       `json:"created_at" gorm:"autoCreateTime;index"`
	UpdatedAt        time.Time       `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt        gorm.DeletedAt  `json:"deleted_at" gorm:"index"`
}

// GetByToken 通过 Token 查询支付链接
func (m *MerchantPaymentLink) GetByToken(tx *gorm.DB, token string) error {
	return tx.Where("token = ?", token).First(m).Error
}

func (m *MerchantPaymentLink) BeforeCreate(*gorm.DB) error {
	if m.ID == 0 {
		m.ID = idgen.NextUint64ID()
	}
	return nil
}
