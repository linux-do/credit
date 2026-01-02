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

package scheduler

import (
	"fmt"
	"sync"
	"time"

	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/task"

	"github.com/hibiken/asynq"
)

var (
	AsynqClient   *asynq.Client
	scheduler     *asynq.Scheduler
	schedulerOnce sync.Once
)

func init() {
	AsynqClient = asynq.NewClient(task.RedisOpt)
}

// StartScheduler 启动调度器
func StartScheduler() error {
	var err error
	schedulerOnce.Do(func() {
		location, locErr := time.LoadLocation("Asia/Shanghai")
		if locErr != nil {
			err = fmt.Errorf("failed to load location: %w", locErr)
			return
		}
		scheduler = asynq.NewScheduler(
			task.RedisOpt,
			&asynq.SchedulerOpts{
				Location: location,
			},
		)

		// 用户积分更新任务
		if _, err = scheduler.Register(
			config.Config.Scheduler.UpdateUserGamificationScoresTaskCron,
			asynq.NewTask(task.UpdateUserGamificationScoresTask, nil),
			asynq.MaxRetry(5),
			asynq.Unique(23*time.Hour),
		); err != nil {
			return
		}

		// 争议自动退款任务
		if _, err = scheduler.Register(
			config.Config.Scheduler.AutoRefundExpiredDisputesTaskCron,
			asynq.NewTask(task.AutoRefundExpiredDisputesTask, nil),
			asynq.MaxRetry(5),
			asynq.Unique(23*time.Hour),
		); err != nil {
			return
		}

		// 订单同步任务
		if _, err = scheduler.Register(
			config.Config.Scheduler.SyncOrdersToClickHouseTaskCron,
			asynq.NewTask(task.SyncOrdersToClickHouseTask, nil),
			asynq.MaxRetry(10),
			asynq.Unique(23*time.Hour),
		); err != nil {
			return
		}

		// 红包过期退款任务
		if _, err = scheduler.Register(
			config.Config.Scheduler.RefundExpiredRedEnvelopesTaskCron,
			asynq.NewTask(task.RefundExpiredRedEnvelopesTask, nil),
			asynq.Unique(23*time.Hour),
		); err != nil {
			return
		}

		// 启动调度器
		err = scheduler.Run()
	})
	return err
}
