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

	"github.com/shopspring/decimal"
)

type RedEnvelopeType string

const (
	RedEnvelopeTypeFixed  RedEnvelopeType = "fixed"
	RedEnvelopeTypeRandom RedEnvelopeType = "random"
)

type RedEnvelopeStatus string

const (
	RedEnvelopeStatusActive   RedEnvelopeStatus = "active"
	RedEnvelopeStatusFinished RedEnvelopeStatus = "finished"
	RedEnvelopeStatusExpired  RedEnvelopeStatus = "expired"
)

// RedEnvelope 红包
type RedEnvelope struct {
	ID               uint64            `json:"id,string" gorm:"primaryKey"`
	CreatorID        uint64            `json:"creator_id,string" gorm:"index;not null"`
	CreatorUsername  string            `json:"creator_username" gorm:"-:migration;->"`
	CreatorAvatarURL string            `json:"creator_avatar_url" gorm:"-:migration;->"`
	Type             RedEnvelopeType   `json:"type" gorm:"type:varchar(20);not null"`
	TotalAmount      decimal.Decimal   `json:"total_amount" gorm:"type:numeric(20,2);not null"`
	RemainingAmount  decimal.Decimal   `json:"remaining_amount" gorm:"type:numeric(20,2);not null"`
	TotalCount       int               `json:"total_count" gorm:"not null"`
	RemainingCount   int               `json:"remaining_count" gorm:"not null"`
	Greeting         string            `json:"greeting" gorm:"size:100"`
	Status           RedEnvelopeStatus `json:"status" gorm:"type:varchar(20);not null"`
	ExpiresAt        time.Time         `json:"expires_at" gorm:"not null;index"`
	CreatedAt        time.Time         `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt        time.Time         `json:"updated_at" gorm:"autoUpdateTime"`
}

// RedEnvelopeClaim 红包领取记录
type RedEnvelopeClaim struct {
	ID            uint64          `json:"id,string" gorm:"primaryKey"`
	RedEnvelopeID uint64          `json:"red_envelope_id,string" gorm:"uniqueIndex:idx_red_envelope_user,priority:2;not null"`
	UserID        uint64          `json:"user_id,string" gorm:"uniqueIndex:idx_red_envelope_user,priority:1;not null"`
	Username      string          `json:"username" gorm:"-:migration;->"`
	AvatarURL     string          `json:"avatar_url" gorm:"-:migration;->"`
	Amount        decimal.Decimal `json:"amount" gorm:"type:numeric(20,2);not null"`
	ClaimedAt     time.Time       `json:"claimed_at" gorm:"autoCreateTime"`
}
