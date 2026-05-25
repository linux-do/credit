package oauth

import (
	"context"
	"encoding/json"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/logger"
	"github.com/linux-do/credit/internal/model"
)

func LogForAudit(ctx context.Context, user *model.User, c *gin.Context) {
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
}
