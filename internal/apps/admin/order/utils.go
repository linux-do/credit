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

package order

import (
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/linux-do/credit/internal/model"
	"gorm.io/gorm"
)

// applyOrderUsernameFilter 先按用户名前缀查用户 ID，再把 ID 条件追加回订单查询。
func applyOrderUsernameFilter(query *gorm.DB, column string, username string) (*gorm.DB, error) {
	username = strings.TrimSpace(username)
	if username == "" {
		return query, nil
	}

	var ids []uint64
	if err := query.Session(&gorm.Session{NewDB: true}).
		Model(&model.User{}).
		Where("username LIKE ?", username+"%").
		Pluck("id", &ids).Error; err != nil {
		return nil, err
	}
	if len(ids) == 0 {
		return query.Where("1 = 0"), nil
	}
	return query.Where(column+" IN ?", ids), nil
}

// appendAdminRemark 追加管理员备注并校验目标字段长度，避免覆盖原备注或争议原因。
func appendAdminRemark(original string, remark string, maxLength int) (string, error) {
	suffix := fmt.Sprintf("[管理员: %s]", remark)
	if original != "" {
		suffix = " " + suffix
	}

	next := original + suffix
	if utf8.RuneCountInString(next) > maxLength {
		return "", errors.New(remarkTooLong)
	}
	return next, nil
}
