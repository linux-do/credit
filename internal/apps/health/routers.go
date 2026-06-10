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

package health

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/logger"
	"github.com/linux-do/credit/internal/util"
)

// Health godoc
// @Tags health
// @Produce json
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/health [get]
func Health(c *gin.Context) {
	c.JSON(http.StatusOK, util.OKNil())
}

// Ready godoc
// @Tags health
// @Produce json
// @Success 200 {object} util.ResponseAny
// @Failure 500 {object} util.ResponseAny
// @Router /api/v1/ready [get]
func Ready(c *gin.Context) {
	ctx := c.Request.Context()

	if config.Config.Database.Enabled {
		sqlDB, err := db.DB(ctx).DB()
		if err != nil {
			logger.ErrorF(ctx, "[Ready] PostgreSQL check failed: %v", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, util.Err("PostgreSQL not ready"))
			return
		}
		if err := sqlDB.PingContext(ctx); err != nil {
			logger.ErrorF(ctx, "[Ready] PostgreSQL check failed: %v", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, util.Err("PostgreSQL not ready"))
			return
		}
	}

	if config.Config.Redis.Enabled {
		if db.Redis == nil {
			logger.ErrorF(ctx, "[Ready] Redis check failed: client is nil")
			c.AbortWithStatusJSON(http.StatusInternalServerError, util.Err("Redis not ready"))
			return
		}
		if err := db.Redis.Ping(ctx).Err(); err != nil {
			logger.ErrorF(ctx, "[Ready] Redis check failed: %v", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, util.Err("Redis not ready"))
			return
		}
	}

	if config.Config.ClickHouse.Enabled {
		if db.ChConn == nil {
			logger.ErrorF(ctx, "[Ready] ClickHouse check failed: client is nil")
			c.AbortWithStatusJSON(http.StatusInternalServerError, util.Err("ClickHouse not ready"))
			return
		}
		if err := db.ChConn.Ping(ctx); err != nil {
			logger.ErrorF(ctx, "[Ready] ClickHouse check failed: %v", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, util.Err("ClickHouse not ready"))
			return
		}
	}

	c.JSON(http.StatusOK, util.OKNil())
}
