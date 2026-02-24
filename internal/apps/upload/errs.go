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

package upload

const (
	ErrNoFileSelected                = "请选择要上传的文件"
	ErrInvalidCoverType              = "无效的封面类型"
	ErrFileTooLarge                  = "图片大小不能超过 2MB"
	ErrUnsupportedFormat             = "只支持 JPG、PNG、WEBP 格式的图片"
	ErrInvalidImage                  = "无效的图片文件"
	ErrUploadExtensionsNotConfigured = "上传扩展名未配置"
	ErrProcessFileFailed             = "处理文件失败"
	ErrCreateDirFailed               = "创建上传目录失败"
	ErrSaveFileFailed                = "保存文件失败"
	ErrOpenFileFailed                = "打开文件失败"
	ErrInvalidFilePath               = "非法文件路径"
	ErrSaveUploadRecordFailed        = "保存上传记录失败"
	ErrQueryHistoryCoverFailed       = "查询历史封面失败"
)
