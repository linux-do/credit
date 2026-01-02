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

package worker

import (
	"log"
	"math/rand"
	"strings"
	"time"

	"github.com/hibiken/asynq"
	"github.com/linux-do/credit/internal/apps/dispute"
	"github.com/linux-do/credit/internal/apps/order"
	"github.com/linux-do/credit/internal/apps/payment"
	"github.com/linux-do/credit/internal/apps/redenvelope"
	"github.com/linux-do/credit/internal/apps/user"
	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/task"
)

// StartWorker 启动任务处理服务器
func StartWorker() error {
	asynqServer := asynq.NewServer(
		task.RedisOpt,
		asynq.Config{
			Concurrency:     config.Config.Worker.Concurrency,
			ShutdownTimeout: 3 * time.Minute,
			Queues:          buildQueuesFromConfig(),
			StrictPriority:  config.Config.Worker.StrictPriority,
			RetryDelayFunc: func(n int, err error, t *asynq.Task) time.Duration {
				log.Printf("[RetryDelayFunc] 任务类型: %s, 重试次数: %d, 错误: %v", t.Type(), n, err)

				// 针对积分更新任务使用更长的重试间隔 + 随机抖动
				if t.Type() == task.UpdateSingleUserGamificationScoreTask {
					var baseDelay time.Duration
					if err != nil && strings.Contains(err.Error(), "429") {
						baseDelay = 120 * time.Second
					} else {
						baseDelay = 60 * time.Second
					}
					// 指数退避：n=0 时 delay=baseDelay，之后翻倍
					delay := baseDelay * time.Duration(1<<uint(n))
					if delay > 30*time.Minute {
						delay = 30 * time.Minute
					}
					// delay ~ 2*delay
					if delay > 0 {
						jitter := time.Duration(rand.Int63n(int64(delay)))
						delay += jitter
					}
					return delay
				}
				return asynq.DefaultRetryDelayFunc(n, err, t)
			},
		},
	)

	// 注册任务处理器
	mux := asynq.NewServeMux()
	mux.Use(taskLoggingMiddleware)
	mux.HandleFunc(task.UpdateUserGamificationScoresTask, user.HandleUpdateUserGamificationScores)
	mux.HandleFunc(task.UpdateSingleUserGamificationScoreTask, user.HandleUpdateSingleUserGamificationScore)
	mux.HandleFunc(task.AutoRefundExpiredDisputesTask, dispute.HandleAutoRefundExpiredDisputes)
	mux.HandleFunc(task.AutoRefundSingleDisputeTask, dispute.HandleAutoRefundSingleDispute)
	mux.HandleFunc(task.MerchantPaymentNotifyTask, payment.HandleMerchantPaymentNotify)
	mux.HandleFunc(task.SyncOrdersToClickHouseTask, order.HandleSyncOrdersToClickHouse)
	mux.HandleFunc(task.RefundExpiredRedEnvelopesTask, redenvelope.HandleRefundExpiredRedEnvelopes)
	// 启动服务器
	return asynqServer.Run(mux)
}

// buildQueuesFromConfig 从配置构建队列映射
func buildQueuesFromConfig() map[string]int {
	queues := make(map[string]int)

	// 从配置读取队列
	if len(config.Config.Worker.Queues) > 0 {
		for _, q := range config.Config.Worker.Queues {
			if q.Name != "" && q.Priority > 0 {
				queues[q.Name] = q.Priority
			}
		}
	}

	// 如果配置为空，使用默认队列
	if len(queues) == 0 {
		queues = map[string]int{
			task.QueueWebhook:       10,
			task.QueueWhitelistOnly: 5,
			task.QueueDefault:       1,
		}
	}

	return queues
}
