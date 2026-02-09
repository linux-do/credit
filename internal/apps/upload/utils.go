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

import (
	"fmt"
	"path/filepath"
	"strings"
)

// ValidatePath 验证路径安全性，防止路径遍历攻击
// 返回经过验证的安全路径
func ValidatePath(basePath, targetPath string) (string, error) {
	// 清理路径
	cleanBase := filepath.Clean(basePath)
	cleanTarget := filepath.Clean(targetPath)

	// 获取绝对路径
	absBase, err := filepath.Abs(cleanBase)
	if err != nil {
		return "", err
	}
	absTarget, err := filepath.Abs(cleanTarget)
	if err != nil {
		return "", err
	}

	// 使用 filepath.Rel 检查路径关系
	rel, err := filepath.Rel(absBase, absTarget)
	if err != nil {
		return "", err
	}

	// 如果相对路径包含 ".."，说明目标路径在基础路径之外
	if strings.HasPrefix(rel, "..") || strings.Contains(rel, string(filepath.Separator)+"..") {
		return "", fmt.Errorf("path traversal detected")
	}

	// 返回经过验证的绝对路径，打破污点传播
	return absTarget, nil
}
