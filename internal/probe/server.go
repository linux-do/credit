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

package probe

import (
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/apps/health"
	"github.com/linux-do/credit/internal/config"
)

// Start launches a lightweight HTTP probe server for non-API processes.
func Start(port int) error {
	if port <= 0 {
		return fmt.Errorf("invalid probe port: %d", port)
	}

	if config.Config.App.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	addr := net.JoinHostPort("", strconv.Itoa(port))
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		return err
	}

	engine := gin.New()
	engine.Use(gin.Recovery())

	apiV1Router := engine.Group(config.Config.App.APIPrefix + "/v1")
	{
		apiV1Router.GET("/health", health.Health)
		apiV1Router.GET("/ready", health.Ready)
	}

	server := &http.Server{
		Handler:           engine,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		if err := server.Serve(listener); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Printf("[Probe] serve failed: %v\n", err)
		}
	}()

	log.Printf("[Probe] listening on :%d\n", port)
	return nil
}
