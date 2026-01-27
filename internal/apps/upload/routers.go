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
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/db/idgen"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
)

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

var (
	// 安全的文件名正则 (只允许字母、数字、下划线、连字符)
	safeFilenameRegex = regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)
)

// UploadResponse 上传响应
type UploadResponse struct {
	URL      string `json:"url"`
	Filename string `json:"filename"`
	Size     int64  `json:"size"`
	Width    int    `json:"width,omitempty"`
	Height   int    `json:"height,omitempty"`
}

// UploadRedEnvelopeCover 上传红包封面
// @Tags upload
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "图片文件"
// @Param type formData string true "封面类型 (cover/heterotypic)"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/upload/redenvelope/cover [post]
func UploadRedEnvelopeCover(c *gin.Context) {
	currentUser, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	// 获取上传的文件
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, util.Err(ErrNoFileSelected))
		return
	}

	// 获取封面类型
	coverType := c.PostForm("type")
	if coverType != "cover" && coverType != "heterotypic" {
		c.JSON(http.StatusBadRequest, util.Err(ErrInvalidCoverType))
		return
	}

	// 验证文件大小
	if file.Size > MaxFileSize {
		c.JSON(http.StatusBadRequest, util.Err(ErrFileTooLarge))
		return
	}

	// 验证文件类型 (Content-Type)
	contentType := file.Header.Get("Content-Type")
	if !strings.Contains(AllowedImageTypes, contentType) {
		c.JSON(http.StatusBadRequest, util.Err(ErrUnsupportedFormat))
		return
	}

	// 打开上传的文件
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(ErrOpenFileFailed))
		return
	}
	defer src.Close()

	// 验证文件确实是图片并获取尺寸
	imgConfig, format, err := image.DecodeConfig(src)
	if err != nil {
		c.JSON(http.StatusBadRequest, util.Err(ErrInvalidImage))
		return
	}

	// 防止图片炸弹攻击 - 检查解码后的图片尺寸
	if imgConfig.Width > MaxImageWidth || imgConfig.Height > MaxImageHeight {
		c.JSON(http.StatusBadRequest, util.Err(ErrImageTooLarge))
		return
	}

	// 验证文件格式是否匹配 Content-Type (防止扩展名欺骗)
	expectedFormat := strings.TrimPrefix(contentType, "image/")
	if expectedFormat == "jpg" {
		expectedFormat = "jpeg"
	}
	if format != expectedFormat && !(format == "jpeg" && expectedFormat == "jpeg") {
		c.JSON(http.StatusBadRequest, util.Err(ErrUnsupportedFormat))
		return
	}

	// 重置文件指针
	src.Close()
	src, _ = file.Open()
	defer src.Close()

	// 计算文件 MD5 以避免重复上传
	hash := md5.New()
	if _, err := io.Copy(hash, src); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(ErrProcessFileFailed))
		return
	}
	md5Sum := hex.EncodeToString(hash.Sum(nil))

	// 重置文件指针
	src.Close()
	src, _ = file.Open()
	defer src.Close()

	// 生成安全的文件名: 用户ID_类型_MD5_时间戳.扩展名
	// 只使用验证过的格式，避免使用用户提供的扩展名
	safeExt := "." + format
	if format == "jpeg" {
		safeExt = ".jpg"
	}
	timestamp := time.Now().Unix()
	filename := fmt.Sprintf("%d_%s_%s_%d%s", currentUser.ID, coverType, md5Sum[:8], timestamp, safeExt)

	// 创建上传目录 (使用更安全的权限)
	uploadPath := filepath.Join(UploadDir, time.Now().Format("2006/01"))
	if err := os.MkdirAll(uploadPath, 0750); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(ErrCreateDirFailed))
		return
	}

	// 完整文件路径 - 使用 filepath.Clean 防止路径遍历
	fullPath := filepath.Clean(filepath.Join(uploadPath, filename))

	// 验证路径安全性并获取经过验证的安全路径
	safePath, err := ValidatePath(uploadPath, fullPath)
	if err != nil {
		c.JSON(http.StatusBadRequest, util.Err(ErrInvalidFilePath))
		return
	}
	// 使用经过验证的安全路径
	fullPath = safePath

	// 检查文件是否已存在
	if _, err := os.Stat(fullPath); err == nil {
		// 文件已存在，直接返回URL
		url := "/" + strings.ReplaceAll(fullPath, "\\", "/")
		c.JSON(http.StatusOK, util.OK(UploadResponse{
			URL:      url,
			Filename: filename,
			Size:     file.Size,
			Width:    imgConfig.Width,
			Height:   imgConfig.Height,
		}))
		return
	}

	// 使用 O_CREATE|O_EXCL 原子性创建文件，防止竞态条件
	dst, err := os.OpenFile(fullPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0640)
	if err != nil {
		if os.IsExist(err) {
			// 文件已存在，返回现有文件
			url := "/" + strings.ReplaceAll(fullPath, "\\", "/")
			c.JSON(http.StatusOK, util.OK(UploadResponse{
				URL:      url,
				Filename: filename,
				Size:     file.Size,
				Width:    imgConfig.Width,
				Height:   imgConfig.Height,
			}))
			return
		}
		c.JSON(http.StatusInternalServerError, util.Err(ErrSaveFileFailed))
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		// 保存失败，删除部分文件
		os.Remove(fullPath)
		c.JSON(http.StatusInternalServerError, util.Err(ErrSaveFileFailed))
		return
	}

	// 返回文件URL
	url := "/" + strings.ReplaceAll(fullPath, "\\", "/")

	// 记录上传信息到数据库
	upload := model.Upload{
		ID:       idgen.NextUint64ID(),
		UserID:   currentUser.ID,
		FilePath: fullPath,
		FileURL:  url,
		FileSize: file.Size,
		MimeType: contentType,
		Purpose:  fmt.Sprintf("red_envelope_%s", coverType),
		Status:   model.UploadStatusPending,
	}
	if err := db.DB(c.Request.Context()).Create(&upload).Error; err != nil {
		// 记录失败不影响上传流程，只记录日志
		// 这样即使数据库出问题，上传功能仍然可用
		fmt.Printf("Failed to track upload: %v\n", err)
	}

	c.JSON(http.StatusOK, util.OK(UploadResponse{
		URL:      url,
		Filename: filename,
		Size:     file.Size,
		Width:    imgConfig.Width,
		Height:   imgConfig.Height,
	}))
}
