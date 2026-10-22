/*
Copyright 2025-2026 linux.do

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

package user

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
)

func TestValidatePayKeyUpdate(t *testing.T) {
	const (
		signKey       = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
		currentPayKey = "123456"
	)

	encryptedPayKey, err := util.Encrypt(signKey, currentPayKey)
	if err != nil {
		t.Fatalf("encrypt current pay key: %v", err)
	}

	userWithPayKey := &model.User{
		SignKey: signKey,
		PayKey:  encryptedPayKey,
	}
	userWithoutPayKey := &model.User{SignKey: signKey}

	tests := []struct {
		name          string
		user          *model.User
		currentPayKey string
		newPayKey     string
		wantErr       error
	}{
		{
			name:      "rejects missing current pay key",
			user:      userWithPayKey,
			newPayKey: "654321",
			wantErr:   errInvalidCurrentPayKey,
		},
		{
			name:          "rejects incorrect current pay key",
			user:          userWithPayKey,
			currentPayKey: "000000",
			newPayKey:     "654321",
			wantErr:       errInvalidCurrentPayKey,
		},
		{
			name:          "accepts correct current pay key",
			user:          userWithPayKey,
			currentPayKey: currentPayKey,
			newPayKey:     "654321",
		},
		{
			name:      "allows initial setup without current pay key",
			user:      userWithoutPayKey,
			newPayKey: "654321",
		},
		{
			name:          "rejects non-numeric current pay key",
			user:          userWithPayKey,
			currentPayKey: "abcdef",
			newPayKey:     "654321",
			wantErr:       errInvalidPayKeyFormat,
		},
		{
			name:          "rejects invalid new pay key length",
			user:          userWithPayKey,
			currentPayKey: currentPayKey,
			newPayKey:     "12345",
			wantErr:       errInvalidPayKeyFormat,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validatePayKeyUpdate(tt.user, tt.currentPayKey, tt.newPayKey)
			if tt.wantErr == nil {
				if err != nil {
					t.Fatalf("validatePayKeyUpdate() error = %v", err)
				}
				return
			}

			if !errors.Is(err, tt.wantErr) {
				t.Fatalf(
					"validatePayKeyUpdate() error = %v, want %v",
					err,
					tt.wantErr,
				)
			}
		})
	}
}

func TestUpdatePayKeyRejectsInvalidFormatAtHTTPBoundary(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name string
		body string
	}{
		{
			name: "rejects missing new pay key",
			body: `{}`,
		},
		{
			name: "rejects short new pay key",
			body: `{"pay_key":"12345"}`,
		},
		{
			name: "rejects non-numeric new pay key",
			body: `{"pay_key":"abcdef"}`,
		},
		{
			name: "rejects malformed current pay key",
			body: `{"current_pay_key":"abcdef","pay_key":"654321"}`,
		},
		{
			name: "rejects non-string pay key",
			body: `{"pay_key":123456}`,
		},
		{
			name: "rejects malformed json",
			body: `{`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(recorder)

			c.Request = httptest.NewRequest(
				http.MethodPut,
				"/api/v1/user/pay-key",
				strings.NewReader(tt.body),
			)
			c.Request.Header.Set("Content-Type", "application/json")

			/*
				所有这些 case 都应该在数据库操作之前被拒绝。
				设置用户 context 是为了确保测试覆盖真实 handler 路径，
				同时不依赖测试数据库。
			*/
			util.SetToContext(
				c,
				oauth.UserObjKey,
				&model.User{ID: 1},
			)

			UpdatePayKey(c)

			if recorder.Code != http.StatusBadRequest {
				t.Fatalf(
					"status = %d, want %d; body=%s",
					recorder.Code,
					http.StatusBadRequest,
					recorder.Body.String(),
				)
			}

			var response struct {
				ErrorMsg  string `json:"error_msg"`
				ErrorCode string `json:"error_code"`
			}

			if err := json.Unmarshal(
				recorder.Body.Bytes(),
				&response,
			); err != nil {
				t.Fatalf("decode response: %v", err)
			}

			if response.ErrorMsg != InvalidPayKeyFormat {
				t.Fatalf(
					"error_msg = %q, want %q",
					response.ErrorMsg,
					InvalidPayKeyFormat,
				)
			}

			if response.ErrorCode != ErrorCodeInvalidPayKeyFormat {
				t.Fatalf(
					"error_code = %q, want %q",
					response.ErrorCode,
					ErrorCodeInvalidPayKeyFormat,
				)
			}
		})
	}
}
