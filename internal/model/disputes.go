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

type DisputeStatus string

const (
	DisputeStatusDisputing DisputeStatus = "disputing"
	DisputeStatusRefund    DisputeStatus = "refund"
	DisputeStatusClosed    DisputeStatus = "closed"
)

type Dispute struct {
	ID                uint64        `json:"id,string" gorm:"primaryKey"`
	OrderID           uint64        `json:"order_id,string" gorm:"uniqueIndex:idx_dispute_order;index:idx_dispute_order_status,priority:1;not null"`
	InitiatorUserID   uint64        `json:"initiator_user_id" gorm:"not null;index:idx_initiator_status_created,priority:1"`
	Reason            string        `json:"reason" gorm:"size:500;not null"`
	Status            DisputeStatus `json:"status" gorm:"type:varchar(20);index;index:idx_dispute_order_status,priority:2;index:idx_initiator_status_created,priority:2;not null;default:'disputing'"`
	HandlerUserID     *uint64       `json:"handler_user_id" gorm:"index"`
	InitiatorUsername string        `json:"initiator_username" gorm:"-:migration;->"`
	HandlerUsername   string        `json:"handler_username" gorm:"-:migration;->"`
	CreatedAt         time.Time     `json:"created_at" gorm:"autoCreateTime;index:idx_initiator_status_created,priority:3"`
	UpdatedAt         time.Time     `json:"updated_at" gorm:"autoUpdateTime"`
}

func (d *Dispute) BeforeCreate(*gorm.DB) error {
	if d.ID == 0 {
		d.ID = idgen.NextUint64ID()
	}
	return nil
}
