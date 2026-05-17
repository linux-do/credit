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

package oauth

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/common"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/logger"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/otel_trace"
	"github.com/linux-do/credit/internal/util"
)

type loginRequiredAuditLog struct {
	UserID     uint64 `json:"user_id"`
	Username   string `json:"username"`
	ClientIP   string `json:"client_ip"`
	Method     string `json:"method"`
	Path       string `json:"path"`
	RequestURI string `json:"request_uri"`
	UserAgent  string `json:"user_agent"`
	Referer    string `json:"referer"`
}

func LoginRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// init trace
		ctx, span := otel_trace.Start(c.Request.Context(), "LoginRequired")
		defer span.End()

		// load user
		userId := GetUserIDFromContext(c)
		if userId <= 0 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error_msg": common.UnAuthorized, "data": nil})
			return
		}

		// load user from db to make sure is active
		var user model.User
		tx := db.DB(ctx).Where("id = ? AND is_active = ?", userId, true).First(&user)
		if tx.Error != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error_msg": tx.Error.Error(), "data": nil})
			return
		}

		auditLog := loginRequiredAuditLog{
			UserID:     user.ID,
			Username:   user.Username,
			ClientIP:   c.ClientIP(),
			Method:     c.Request.Method,
			Path:       c.Request.URL.Path,
			RequestURI: c.Request.RequestURI,
			UserAgent:  c.Request.UserAgent(),
			Referer:    c.Request.Referer(),
		}
		auditJSON, err := json.Marshal(auditLog)
		if err != nil {
			logger.ErrorF(ctx, "[LoginRequiredAudit] marshal failed: %v", err)
			logger.InfoF(ctx, "[LoginRequiredAudit] %s %d %s", c.ClientIP(), user.ID, user.Username)
		} else {
			logger.InfoF(ctx, "[LoginRequiredAudit] %s", auditJSON)
		}

		// set user info
		util.SetToContext(c, UserObjKey, &user)

		if risk, ok := checkOpenAPIUserRisk(ctx, user.ID); ok {
			if blocked := applyOpenAPIUserRisk(c, risk); blocked {
				return
			}
		}

		// next
		c.Next()
	}
}
