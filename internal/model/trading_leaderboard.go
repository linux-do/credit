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

// PeriodType 周期类型
type PeriodType string

const (
	PeriodTypeDay     PeriodType = "day"
	PeriodTypeWeek    PeriodType = "week"
	PeriodTypeMonth   PeriodType = "month"
	PeriodTypeAllTime PeriodType = "all_time"
)

// MetricType 排名指标类型
type MetricType string

const (
	MetricReceiveAmount     MetricType = "receive_amount"
	MetricPaymentAmount     MetricType = "payment_amount"
	MetricTransferInAmount  MetricType = "transfer_in_amount"
	MetricTransferOutAmount MetricType = "transfer_out_amount"
	MetricVolumeAmount      MetricType = "volume_amount"
	MetricNetAmount         MetricType = "net_amount"
)

// TrendType 排名趋势
type TrendType string

const (
	TrendUp   TrendType = "up"
	TrendDown TrendType = "down"
	TrendSame TrendType = "same"
)

// TradingLeaderboardRanking 交易排行榜快照
type TradingLeaderboardRanking struct {
	ID          uint64          `json:"id,string" gorm:"primaryKey"`
	PeriodType  PeriodType      `json:"period_type" gorm:"type:varchar(20);not null;index:idx_lb_lookup,priority:1;index:idx_lb_user,priority:2"`
	PeriodStart time.Time       `json:"period_start" gorm:"type:date;not null;index:idx_lb_lookup,priority:2;index:idx_lb_user,priority:3"`
	PeriodEnd   time.Time       `json:"period_end" gorm:"type:date;not null"`
	Metric      MetricType      `json:"metric" gorm:"type:varchar(30);not null;index:idx_lb_lookup,priority:3;index:idx_lb_user,priority:4"`
	SnapshotAt  time.Time       `json:"snapshot_at" gorm:"not null;index:idx_lb_lookup,priority:4;index:idx_lb_snapshot"`
	Rank        int             `json:"rank" gorm:"not null;index:idx_lb_lookup,priority:5"`
	UserID      uint64          `json:"user_id" gorm:"not null;index:idx_lb_user,priority:1"`
	Score       decimal.Decimal `json:"score" gorm:"type:numeric(20,2);not null"`

	PreviousRank *int       `json:"previous_rank"`
	Trend        *TrendType `json:"trend" gorm:"type:varchar(10)"`

	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

func (TradingLeaderboardRanking) TableName() string {
	return "trading_leaderboard_rankings"
}

func (r *TradingLeaderboardRanking) BeforeCreate(*gorm.DB) error {
	if r.ID == 0 {
		r.ID = idgen.NextUint64ID()
	}
	return nil
}
