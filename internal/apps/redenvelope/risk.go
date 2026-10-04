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

package redenvelope

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/common"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
)

type claimRisk struct {
	key      string
	limit    int
	cooldown int
}

func newClaimRisk(ctx context.Context, userID uint64) (*claimRisk, error) {
	var limitConfig, cooldownConfig model.SystemConfig
	if err := limitConfig.GetByKey(ctx, model.ConfigKeyRedEnvelopeClaimErrorLimit); err != nil {
		return nil, err
	}
	if err := cooldownConfig.GetByKey(ctx, model.ConfigKeyRedEnvelopeClaimCooldownSeconds); err != nil {
		return nil, err
	}
	limit, limitErr := strconv.Atoi(limitConfig.Value)
	cooldown, cooldownErr := strconv.Atoi(cooldownConfig.Value)
	if limitErr != nil || cooldownErr != nil || limit <= 0 || cooldown <= 0 || int64(cooldown) > int64((1<<63-1)/time.Second) {
		return nil, nil
	}
	return &claimRisk{
		key:      fmt.Sprintf("red_envelope:claim_risk:%d", userID),
		limit:    limit,
		cooldown: cooldown,
	}, nil
}

type claimCooldownError struct {
	seconds int64
}

func (e *claimCooldownError) Error() string {
	return fmt.Sprintf(common.RedEnvelopeClaimCooldown, e.seconds)
}

type claimRiskState struct {
	Count        int       `json:"count"`
	BlockedUntil time.Time `json:"blocked_until"`
}

func (r *claimRisk) update(ctx context.Context, outcome string) error {
	if r == nil {
		return nil
	}
	blocked := false
	err := db.UpdateJSON(ctx, r.key, func(state *claimRiskState) (time.Duration, bool, error) {
		if remaining := time.Until(state.BlockedUntil); remaining > 0 {
			return 0, false, &claimCooldownError{seconds: int64((remaining-1)/time.Second) + 1}
		}
		switch outcome {
		case "valid":
			return -1, true, nil
		case "invalid":
			if !state.BlockedUntil.IsZero() {
				state.Count = 0
			}
			state.Count++
			if state.Count >= r.limit {
				blocked = true
				cooldown := time.Duration(r.cooldown) * time.Second
				state.BlockedUntil = time.Now().Add(cooldown)
				return cooldown, true, nil
			}
			return 0, true, nil
		default:
			return 0, false, nil
		}
	})
	if err != nil {
		return err
	}
	if blocked {
		return &claimCooldownError{seconds: int64(r.cooldown)}
	}
	return nil
}

func respondClaimRiskError(c *gin.Context, err error) {
	if cooldown, ok := err.(*claimCooldownError); ok {
		c.Header("Retry-After", strconv.FormatInt(cooldown.seconds, 10))
		c.JSON(http.StatusTooManyRequests, util.Err(cooldown.Error()))
		return
	}
	c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
}
