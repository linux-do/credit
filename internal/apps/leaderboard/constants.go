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
)

const (
	cacheKeyPrefix  = "leaderboard:"
	cacheTTL        = 5 * time.Minute
	defaultPageSize = 20
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
