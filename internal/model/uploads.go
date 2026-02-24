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

package model

import (
	"time"
)

// UploadStatus 上传状态
type UploadStatus string

const (
	UploadStatusPending UploadStatus = "pending" // 待使用
	UploadStatusUsed    UploadStatus = "used"    // 已使用
	UploadStatusDeleted UploadStatus = "deleted" // 已删除
)

// UploadType 上传类型常量
const (
	UploadTypeCover       = "cover"       // 红包背景封面
	UploadTypeHeterotypic = "heterotypic" // 红包异形装饰
)

// Upload 上传文件记录
type Upload struct {
	ID        uint64       `json:"id,string" gorm:"primaryKey"`
	UserID    uint64       `json:"user_id,string" gorm:"index;not null"`
	FilePath  string       `json:"file_path" gorm:"size:500;not null;uniqueIndex"` // 文件路径
	FileSize  int64        `json:"file_size" gorm:"not null"`                      // 文件大小（字节）
	Type      string       `json:"type" gorm:"column:type;size:50;not null;index"` // 类型 (cover, heterotypic)
	Status    UploadStatus `json:"status" gorm:"type:varchar(20);not null"`        // 状态
	CreatedAt time.Time    `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time    `json:"updated_at" gorm:"autoUpdateTime"`
}
