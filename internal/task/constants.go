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

package task

const (
	UpdateUserGamificationScoresTask      = "user:gamification:update_scores_task"
	UpdateSingleUserGamificationScoreTask = "user:gamification:update_single_score_task"
	AutoRefundExpiredDisputesTask         = "dispute:auto_refund_expired"
	AutoRefundSingleDisputeTask           = "dispute:auto_refund_single"
	MerchantPaymentNotifyTask             = "payment:merchant_notify"
	SyncOrdersToClickHouseTask            = "order:sync_to_clickhouse"
	RefundExpiredRedEnvelopesTask         = "redenvelope:refund_expired"
)

const (
	QueueWhitelistOnly = "whitelist_only"
	QueueWebhook       = "webhook"
	QueueDefault       = "default"
)

// 管理员可下发的任务类型标识
const (
	TaskTypeOrderSync         = "order_sync"
	TaskTypeUserGamification  = "user_gamification"
	TaskTypeDisputeRefund     = "dispute_auto_refund"
	TaskTypeRedEnvelopeRefund = "redenvelope_auto_refund"
)

// TaskMeta 任务元数据
type TaskMeta struct {
	Type         string
	AsynqTask    string
	Name         string
	Description  string
	SupportsTime bool
	MaxRetry     int
	Queue        string
}

// DispatchableTasks 可下发的任务列表
var DispatchableTasks = []TaskMeta{
	{
		Type:         TaskTypeOrderSync,
		AsynqTask:    SyncOrdersToClickHouseTask,
		Name:         "订单同步",
		Description:  "同步订单数据到 ClickHouse",
		SupportsTime: true,
		MaxRetry:     5,
		Queue:        QueueDefault,
	},
	{
		Type:         TaskTypeUserGamification,
		AsynqTask:    UpdateSingleUserGamificationScoreTask,
		Name:         "用户积分更新",
		Description:  "更新用户的点数积分",
		SupportsTime: false,
		MaxRetry:     5,
		Queue:        QueueWhitelistOnly,
	},
	{
		Type:         TaskTypeDisputeRefund,
		AsynqTask:    AutoRefundExpiredDisputesTask,
		Name:         "争议自动退款",
		Description:  "处理过期争议的自动退款",
		SupportsTime: false,
		MaxRetry:     5,
		Queue:        QueueDefault,
	},
	{
		Type:         TaskTypeRedEnvelopeRefund,
		AsynqTask:    RefundExpiredRedEnvelopesTask,
		Name:         "红包自动退款",
		Description:  "处理过期红包的自动退款",
		SupportsTime: false,
		MaxRetry:     5,
		Queue:        QueueDefault,
	},
}

// GetTaskMeta 根据任务类型获取元数据
func GetTaskMeta(taskType string) *TaskMeta {
	for _, t := range DispatchableTasks {
		if t.Type == taskType {
			return &t
		}
	}
	return nil
}
