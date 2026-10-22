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

import "time"

// PublicAccountBinding 公共账号与真实用户的绑定关系（多对多）
type PublicAccountBinding struct {
	ID              uint64    `json:"id,string" gorm:"primaryKey;autoIncrement"`
	PublicAccountID int64     `json:"public_account_id,string" gorm:"uniqueIndex:uk_binding_pa_user,priority:1;not null"`
	UserID          int64     `json:"user_id,string" gorm:"uniqueIndex:uk_binding_pa_user,priority:2;index:idx_binding_user_pa,priority:1;not null"`
	CreatedAt       time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt       time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
