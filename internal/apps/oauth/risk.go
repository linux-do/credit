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
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/logger"
	"github.com/linux-do/credit/internal/util"
	"github.com/redis/go-redis/v9"
)

const (
	openAPIRiskCacheKeyFormat = "openapi_risk:user:%d"
	minOpenAPIRiskCacheTTL    = time.Hour

	riskLevelHeader  = "X-Credit-Risk-Level"
	riskLabelsHeader = "X-Credit-Risk-Labels"
	riskItemsHeader  = "X-Credit-Risks"
	exposeHeader     = "Access-Control-Expose-Headers"

	riskBlockedCode = "RISK_BLOCKED"
	riskBlockedMsg  = "账号存在风险"
)

type openAPIUserRiskItem struct {
	Label string `json:"label"`
	Value string `json:"value"`
	Desc  string `json:"desc"`
}

type openAPIUserRiskResponse struct {
	Risky     bool                  `json:"risky"`
	RiskLevel string                `json:"risk_level"`
	Risks     []openAPIUserRiskItem `json:"risks"`
}

type riskBlockDetails struct {
	RiskLevel  string                `json:"risk_level"`
	RiskLabels []string              `json:"risk_labels"`
	Risks      []openAPIUserRiskItem `json:"risks"`
}

func checkOpenAPIUserRisk(ctx context.Context, userID uint64) (*openAPIUserRiskResponse, bool) {
	cfg := config.Config.OpenAPIRisk
	if !cfg.Enabled || strings.TrimSpace(cfg.BaseURL) == "" {
		return nil, false
	}
	if db.Redis == nil {
		logger.ErrorF(ctx, "[OpenAPIRisk] redis is not initialized, skip risk check")
		return nil, false
	}

	cacheKey := fmt.Sprintf(openAPIRiskCacheKeyFormat, userID)
	var cached openAPIUserRiskResponse
	if err := db.GetJSON(ctx, cacheKey, &cached); err == nil {
		return &cached, true
	} else if err != nil && !errors.Is(err, redis.Nil) {
		logger.ErrorF(ctx, "[OpenAPIRisk] read cache failed, skip risk check: %v", err)
		return nil, false
	}

	risk, err := fetchOpenAPIUserRisk(ctx, userID)
	if err != nil {
		logger.ErrorF(ctx, "[OpenAPIRisk] fetch user risk failed, skip risk check: %v", err)
		return nil, false
	}

	if err := db.SetJSON(ctx, cacheKey, risk, openAPIRiskCacheTTL()); err != nil {
		logger.ErrorF(ctx, "[OpenAPIRisk] write cache failed, skip risk check: %v", err)
		return nil, false
	}

	return risk, true
}

func fetchOpenAPIUserRisk(ctx context.Context, userID uint64) (*openAPIUserRiskResponse, error) {
	cfg := config.Config.OpenAPIRisk
	endpoint := fmt.Sprintf(
		"%s/api/open/v1/risk/users/%d",
		strings.TrimRight(cfg.BaseURL, "/"),
		userID,
	)

	headers := map[string]string{
		"Accept": "application/json",
	}
	if cfg.Username != "" || cfg.Password != "" {
		token := base64.StdEncoding.EncodeToString([]byte(cfg.Username + ":" + cfg.Password))
		headers["Authorization"] = "Basic " + token
	}

	resp, err := util.Request(ctx, http.MethodGet, endpoint, nil, headers, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var risk openAPIUserRiskResponse
	if err := json.NewDecoder(resp.Body).Decode(&risk); err != nil {
		return nil, fmt.Errorf("decode response failed: %w", err)
	}

	return &risk, nil
}

func openAPIRiskCacheTTL() time.Duration {
	ttl := time.Duration(config.Config.OpenAPIRisk.CacheTTLSeconds) * time.Second
	if ttl < minOpenAPIRiskCacheTTL {
		return minOpenAPIRiskCacheTTL
	}
	return ttl
}

func applyOpenAPIUserRisk(c *gin.Context, risk *openAPIUserRiskResponse) bool {
	if risk == nil || !risk.Risky {
		return false
	}

	labels := riskLabels(risk)
	items := riskItems(risk)
	cfg := config.Config.OpenAPIRisk
	if containsString(cfg.BlockRiskLevels, risk.RiskLevel) {
		setRiskHeaders(c, risk.RiskLevel, labels, items)
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"error_code": riskBlockedCode,
			"error_msg":  riskBlockedMsg,
			"details": riskBlockDetails{
				RiskLevel:  risk.RiskLevel,
				RiskLabels: labels,
				Risks:      items,
			},
		})
		return true
	}

	if containsString(cfg.PromptRiskLevels, risk.RiskLevel) {
		setRiskHeaders(c, risk.RiskLevel, labels, items)
	}

	return false
}

func setRiskHeaders(c *gin.Context, riskLevel string, labels []string, items []openAPIUserRiskItem) {
	labelsJSON, err := json.Marshal(labels)
	if err != nil {
		logger.ErrorF(c.Request.Context(), "[OpenAPIRisk] marshal risk labels failed: %v", err)
		return
	}

	itemsJSON, err := json.Marshal(items)
	if err != nil {
		logger.ErrorF(c.Request.Context(), "[OpenAPIRisk] marshal risk items failed: %v", err)
		return
	}

	c.Header(riskLevelHeader, riskLevel)
	c.Header(riskLabelsHeader, base64.StdEncoding.EncodeToString(labelsJSON))
	c.Header(riskItemsHeader, base64.StdEncoding.EncodeToString(itemsJSON))
	appendExposeHeaders(c, riskLevelHeader, riskLabelsHeader, riskItemsHeader)
}

func appendExposeHeaders(c *gin.Context, names ...string) {
	existing := c.Writer.Header().Get(exposeHeader)
	exposed := make([]string, 0, len(names)+1)
	if existing != "" {
		exposed = append(exposed, strings.Split(existing, ",")...)
	}
	exposed = append(exposed, names...)

	seen := make(map[string]struct{}, len(exposed))
	normalized := make([]string, 0, len(exposed))
	for _, header := range exposed {
		header = strings.TrimSpace(header)
		if header == "" {
			continue
		}
		key := strings.ToLower(header)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		normalized = append(normalized, header)
	}

	c.Header(exposeHeader, strings.Join(normalized, ", "))
}

func riskLabels(risk *openAPIUserRiskResponse) []string {
	labels := make([]string, 0, len(risk.Risks))
	for _, item := range risk.Risks {
		label := strings.TrimSpace(item.Label)
		if label == "" {
			continue
		}
		labels = append(labels, label)
	}
	return labels
}

func riskItems(risk *openAPIUserRiskResponse) []openAPIUserRiskItem {
	items := make([]openAPIUserRiskItem, 0, len(risk.Risks))
	for _, item := range risk.Risks {
		item.Label = strings.TrimSpace(item.Label)
		item.Value = strings.TrimSpace(item.Value)
		item.Desc = strings.TrimSpace(item.Desc)
		if item.Label == "" {
			continue
		}
		items = append(items, item)
	}
	return items
}

func containsString(values []string, target string) bool {
	target = strings.TrimSpace(target)
	for _, value := range values {
		if strings.TrimSpace(value) == target {
			return true
		}
	}
	return false
}
