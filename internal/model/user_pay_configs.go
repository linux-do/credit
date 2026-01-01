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
	"gorm.io/gorm"
)

type PayLevel uint8

const (
	PayLevelFree PayLevel = iota
	PayLevelBasic
	PayLevelStandard
	PayLevelPremium
)

type UserPayConfig struct {
	ID             uint64          `json:"id,string" gorm:"primaryKey;autoIncrement"`
	Level          PayLevel        `json:"level" gorm:"uniqueIndex;not null"`
	MinScore       int64           `json:"min_score" gorm:"not null;index:idx_score_range,priority:1"`
	MaxScore       *int64          `json:"max_score" gorm:"index:idx_score_range,priority:2"`
	DailyLimit     *int64          `json:"daily_limit"`
	FeeRate        decimal.Decimal `json:"fee_rate" gorm:"type:numeric(3,2);default:0;check:fee_rate >= 0 AND fee_rate <= 1"`
	ScoreRate      decimal.Decimal `json:"score_rate" gorm:"type:numeric(3,2);default:0;check:score_rate >= 0 AND score_rate <= 1"`
	DistributeRate decimal.Decimal `json:"distribute_rate" gorm:"type:numeric(3,2);default:0;check:distribute_rate >= 0 AND distribute_rate <= 1"`
	CreatedAt      time.Time       `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt      time.Time       `json:"updated_at" gorm:"autoUpdateTime"`
}

// GetByPayScore 通过 pay_score 查询对应的支付配置
func (upc *UserPayConfig) GetByPayScore(tx *gorm.DB, payScore int64) error {
	return tx.Where("min_score <= ?", payScore).
		Where("max_score IS NULL OR max_score > ?", payScore).
		First(upc).Error
}

// GetByID 通过 ID 查询支付配置
func (upc *UserPayConfig) GetByID(tx *gorm.DB, id uint64) error {
	return tx.Where("id = ?", id).First(upc).Error
}
