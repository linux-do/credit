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
	// 上传目录
	UploadDir = "uploads/redenvelope"

	// 允许的图片类型
	AllowedImageTypes = "image/jpeg,image/png,image/jpg,image/webp"

	// 最大文件大小 (2MB)
	MaxFileSize = 2 * 1024 * 1024

	// 最大图片尺寸
	MaxImageWidth  = 4096
	MaxImageHeight = 4096
)
