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
	"testing"

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
		wantErr       string
	}{
		{
			name:      "rejects missing current pay key",
			user:      userWithPayKey,
			newPayKey: "654321",
			wantErr:   InvalidCurrentPayKey,
		},
		{
			name:          "rejects incorrect current pay key",
			user:          userWithPayKey,
			currentPayKey: "000000",
			newPayKey:     "654321",
			wantErr:       InvalidCurrentPayKey,
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
			wantErr:       InvalidPayKeyFormat,
		},
		{
			name:          "rejects invalid new pay key length",
			user:          userWithPayKey,
			currentPayKey: currentPayKey,
			newPayKey:     "12345",
			wantErr:       InvalidPayKeyFormat,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validatePayKeyUpdate(tt.user, tt.currentPayKey, tt.newPayKey)
			if tt.wantErr == "" {
				if err != nil {
					t.Fatalf("validatePayKeyUpdate() error = %v", err)
				}
				return
			}
			if err == nil || err.Error() != tt.wantErr {
				t.Fatalf("validatePayKeyUpdate() error = %v, want %q", err, tt.wantErr)
			}
		})
	}
}
