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
	"encoding/json"
	"errors"
	"fmt"
	"io"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/linux-do/credit/internal/common"
	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/otel_trace"
	"go.opentelemetry.io/otel/codes"
	"gorm.io/gorm"
)

func GetUserIDFromSession(s sessions.Session) uint64 {
	userID, ok := s.Get(UserIDKey).(uint64)
	if !ok {
		return 0
	}
	return userID
}

func GetUserIDFromContext(c *gin.Context) uint64 {
	session := sessions.Default(c)
	return GetUserIDFromSession(session)
}

// doOAuth 执行 OAuth2/OIDC 认证流程
func doOAuth(ctx context.Context, code string, nonce string) (*model.User, error) {
	ctx, span := otel_trace.Start(ctx, "OAuth")
	defer span.End()

	// 使用授权码换取 Token
	token, err := oauthConf.Exchange(ctx, code)
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	var userInfo model.OAuthUserInfo

	if oidcVerifier != nil {
		if rawIDToken, ok := token.Extra("id_token").(string); ok {
			idToken, verifyErr := oidcVerifier.Verify(ctx, rawIDToken)
			if verifyErr != nil {
				err := fmt.Errorf("%s: %w", IDTokenVerifyFailed, verifyErr)
				span.SetStatus(codes.Error, err.Error())
				return nil, err
			}
			if nonce != "" && idToken.Nonce != nonce {
				span.SetStatus(codes.Error, NonceMismatch)
				return nil, errors.New(NonceMismatch)
			}
			if claimsErr := idToken.Claims(&userInfo); claimsErr != nil {
				span.SetStatus(codes.Error, claimsErr.Error())
				return nil, claimsErr
			}
		}
	}

	if userInfo.GetID() == 0 {
		client := oauthConf.Client(ctx, token)
		resp, httpErr := client.Get(config.Config.OAuth2.UserEndpoint)
		if httpErr != nil {
			span.SetStatus(codes.Error, httpErr.Error())
			return nil, httpErr
		}
		defer resp.Body.Close()

		responseData, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			span.SetStatus(codes.Error, readErr.Error())
			return nil, readErr
		}
		if unmarshalErr := json.Unmarshal(responseData, &userInfo); unmarshalErr != nil {
			span.SetStatus(codes.Error, unmarshalErr.Error())
			return nil, unmarshalErr
		}
	}

	if !userInfo.Active {
		err = errors.New(common.BannedAccount)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	var user model.User
	err = db.DB(ctx).Transaction(func(tx *gorm.DB) error {
		var holder model.User
		if conflictErr := tx.Where("username = ? AND id != ?", userInfo.Username, userInfo.GetID()).First(&holder).Error; conflictErr == nil {
			// 存在冲突 -> 将占用者改名并注销
			newParams := map[string]interface{}{
				"username":  fmt.Sprintf("%s已注销: %s", holder.Username, uuid.NewString()),
				"is_active": false,
			}
			if updateErr := tx.Model(&holder).Updates(newParams).Error; updateErr != nil {
				return updateErr
			}
		}

		// 根据 ID 处理当前用户的 更新 或 创建
		if queryErr := tx.Where("id = ?", userInfo.GetID()).First(&user).Error; queryErr == nil {
			// 用户已存在 -> 更新信息
			if activeErr := user.CheckActive(); activeErr != nil {
				return activeErr
			}
			user.UpdateFromOAuthInfo(&userInfo)
			if saveErr := tx.Save(&user).Error; saveErr != nil {
				return saveErr
			}
		} else if errors.Is(queryErr, gorm.ErrRecordNotFound) {
			// 用户不存在 -> 创建新用户
			user = model.User{}
			if createErr := user.CreateWithInitialCredit(tx, &userInfo); createErr != nil {
				return createErr
			}
		} else {
			return queryErr
		}

		return nil
	})
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	return &user, nil
}
