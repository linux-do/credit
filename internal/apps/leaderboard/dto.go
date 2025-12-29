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

package leaderboard

import (
	"time"

	"github.com/shopspring/decimal"
)

// PeriodType 时间周期类型
type PeriodType string

const (
	PeriodDay     PeriodType = "day"
	PeriodWeek    PeriodType = "week"
	PeriodMonth   PeriodType = "month"
	PeriodAllTime PeriodType = "all_time"
)

// MetricType 指标类型
type MetricType string

const (
	MetricReceiveAmount     MetricType = "receive_amount"
	MetricPaymentAmount     MetricType = "payment_amount"
	MetricTransferInAmount  MetricType = "transfer_in_amount"
	MetricTransferOutAmount MetricType = "transfer_out_amount"
	MetricVolumeAmount      MetricType = "volume_amount"
	MetricNetAmount         MetricType = "net_amount"
)

// ListRequest 排行榜列表请求
type ListRequest struct {
	Period   PeriodType `form:"period" binding:"omitempty,oneof=day week month all_time"`
	Date     string     `form:"date" binding:"omitempty"`
	Metric   MetricType `form:"metric" binding:"omitempty,oneof=receive_amount payment_amount transfer_in_amount transfer_out_amount volume_amount net_amount"`
	Page     int        `form:"page" binding:"omitempty,min=1"`
	PageSize int        `form:"page_size" binding:"omitempty,min=1,max=100"`
}

// LeaderboardEntry 排行榜条目
type LeaderboardEntry struct {
	Rank         int             `json:"rank"`
	UserID       uint64          `json:"user_id"`
	Username     string          `json:"username"`
	AvatarURL    string          `json:"avatar_url"`
	Score        decimal.Decimal `json:"score"`
	PreviousRank *int            `json:"previous_rank,omitempty"`
}

// LeaderboardPeriod 时间周期信息
type LeaderboardPeriod struct {
	Type      PeriodType `json:"type"`
	Start     string     `json:"start"`
	End       string     `json:"end"`
	StartTime time.Time  `json:"-"`
	EndTime   time.Time  `json:"-"`
}

// ListResponse 排行榜列表响应
type ListResponse struct {
	Period     LeaderboardPeriod  `json:"period"`
	Metric     MetricType         `json:"metric"`
	SnapshotAt string             `json:"snapshot_at"`
	Page       int                `json:"page"`
	PageSize   int                `json:"page_size"`
	Total      int64              `json:"total"`
	Items      []LeaderboardEntry `json:"items"`
}

// UserRankResponse 用户排名响应
type UserRankResponse struct {
	Period     LeaderboardPeriod `json:"period"`
	Metric     MetricType        `json:"metric"`
	SnapshotAt string            `json:"snapshot_at"`
	User       UserRankInfo      `json:"user"`
}

// UserRankInfo 用户排名信息
type UserRankInfo struct {
	UserID uint64          `json:"user_id"`
	Rank   int             `json:"rank"`
	Score  decimal.Decimal `json:"score"`
}

// MetricInfo 指标信息
type MetricInfo struct {
	Key  MetricType `json:"key"`
	Name string     `json:"name"`
}

// MetadataResponse 元数据响应
type MetadataResponse struct {
	Periods  []PeriodType `json:"periods"`
	Metrics  []MetricInfo `json:"metrics"`
	Timezone string       `json:"timezone"`
	Defaults struct {
		Period   PeriodType `json:"period"`
		Metric   MetricType `json:"metric"`
		PageSize int        `json:"page_size"`
	} `json:"defaults"`
}
