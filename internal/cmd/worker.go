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

package cmd

import (
	"log"

	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/probe"
	"github.com/linux-do/credit/internal/task/worker"

	"github.com/spf13/cobra"
)

var workerCmd = &cobra.Command{
	Use:   "worker",
	Short: "credit Worker",
	Run: func(cmd *cobra.Command, args []string) {
		log.Println("[Worker] 启动任务处理服务")
		if err := probe.Start(config.Config.Worker.Port); err != nil {
			log.Fatalf("[Worker] 启动探针服务失败: %v", err)
		}
		if err := worker.StartWorker(); err != nil {
			log.Fatalf("[工作器] 启动失败: %v", err)
		}
	},
}
