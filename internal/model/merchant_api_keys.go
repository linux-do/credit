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
	"gorm.io/gorm"
)

type MerchantAPIKey struct {
	ID             uint64         `json:"id,string" gorm:"primaryKey"`
	UserID         uint64         `json:"user_id" gorm:"not null;index:idx_merchant_api_keys_user_created,priority:1"`
	ClientID       string         `json:"client_id" gorm:"size:64;uniqueIndex;index:idx_client_credentials,priority:2;not null"`
	ClientSecret   string         `json:"client_secret" gorm:"size:64;index:idx_client_credentials,priority:1;not null"`
	AppName        string         `json:"app_name" gorm:"size:20;not null"`
	AppHomepageURL string         `json:"app_homepage_url" gorm:"size:100;not null"`
	AppDescription string         `json:"app_description" gorm:"size:100"`
	RedirectURI    string         `json:"redirect_uri" gorm:"size:100"`
	NotifyURL      string         `json:"notify_url" gorm:"size:100;not null"`
	TestMode       bool           `json:"test_mode" gorm:"default:false"`
	CreatedAt      time.Time      `json:"created_at" gorm:"autoCreateTime;index:idx_merchant_api_keys_user_created,priority:2"`
	UpdatedAt      time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt      gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// GetByID 通过 ID 查询商户 API Key
func (m *MerchantAPIKey) GetByID(tx *gorm.DB, id uint64) error {
	return tx.Where("id = ?", id).First(m).Error
}

// GetByClientID 通过 ClientID 查询商户 API Key
func (m *MerchantAPIKey) GetByClientID(tx *gorm.DB, clientID string) error {
	return tx.Where("client_id = ?", clientID).First(m).Error
}

func (m *MerchantAPIKey) BeforeCreate(*gorm.DB) error {
	if m.ID == 0 {
		m.ID = idgen.NextUint64ID()
	}
	return nil
}
