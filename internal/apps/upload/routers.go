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
	"errors"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/db/idgen"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
	"gorm.io/gorm"
)

// UploadResponse 上传响应
type UploadResponse struct {
	ID uint64 `json:"id,string"`
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
	if coverType != CoverTypeCover && coverType != CoverTypeHeterotypic {
		c.JSON(http.StatusBadRequest, util.Err(ErrInvalidCoverType))
		return
	}

	// 验证文件大小
	if file.Size > int64(MaxFileSize) {
		c.JSON(http.StatusBadRequest, util.Err(ErrFileTooLarge))
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
	_, format, err := image.DecodeConfig(src)
	if err != nil {
		c.JSON(http.StatusBadRequest, util.Err(ErrInvalidImage))
		return
	}

	// 验证图片类型
	norm := strings.ToLower(format)
	if norm == "jpeg" {
		norm = "jpg"
	}
	var sc model.SystemConfig
	if err := sc.GetByKey(c.Request.Context(), model.ConfigKeyUploadAllowedExtensions); err != nil || strings.TrimSpace(sc.Value) == "" {
		c.JSON(http.StatusInternalServerError, util.Err(ErrUploadExtensionsNotConfigured))
		return
	}
	v := strings.ToLower(strings.ReplaceAll(sc.Value, " ", ""))
	v = strings.ReplaceAll(v, "jpeg", "jpg")
	if !strings.Contains(","+v+",", ","+norm+",") {
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

	// 生成安全的文件名: 用户ID_类型_MD5.扩展名
	// 使用完整 MD5 实现去重，同一用户上传相同图片会命中已有文件
	safeExt := "." + format
	if format == "jpeg" {
		safeExt = ".jpg"
	}
	filename := fmt.Sprintf("%d_%s_%s%s", currentUser.ID, coverType, md5Sum, safeExt)

	// 创建上传目录，格式: uploads/2026/01/01/userid
	now := time.Now()
	uploadPath := filepath.Join(UploadDir, now.Format("2006/01/02"), fmt.Sprintf("%d", currentUser.ID))
	if err := os.MkdirAll(uploadPath, 0750); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(ErrCreateDirFailed))
		return
	}

	relPath := filepath.ToSlash(filepath.Join(uploadPath, filename))
	diskPath := filepath.Join(uploadPath, filename)

	// 验证路径安全性
	safeDiskPath, err := ValidatePath(UploadDir, diskPath)
	if err != nil {
		c.JSON(http.StatusBadRequest, util.Err(ErrInvalidImage))
		return
	}

	var recordID uint64

	if err := db.DB(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		var existing model.Upload
		if err := tx.Where("file_path = ?", relPath).First(&existing).Error; err == nil {
			recordID = existing.ID
			return nil
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		fileCreated := false
		if _, err := os.Stat(safeDiskPath); err != nil {
			if !os.IsNotExist(err) {
				return errors.New(ErrSaveFileFailed)
			}
			dst, err := os.OpenFile(safeDiskPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0640)
			if err != nil {
				if !os.IsExist(err) {
					return errors.New(ErrSaveFileFailed)
				}
			} else {
				fileCreated = true
				if _, err := io.Copy(dst, src); err != nil {
					dst.Close()
					os.Remove(safeDiskPath)
					return errors.New(ErrSaveFileFailed)
				}
				if err := dst.Close(); err != nil {
					os.Remove(safeDiskPath)
					return errors.New(ErrSaveFileFailed)
				}
			}
		}

		upload := model.Upload{
			ID:       idgen.NextUint64ID(),
			UserID:   currentUser.ID,
			FilePath: relPath,
			FileSize: file.Size,
			Type:     coverType,
			Status:   model.UploadStatusPending,
		}

		if err := tx.Create(&upload).Error; err != nil {
			if fileCreated {
				os.Remove(safeDiskPath)
			}
			return errors.New(ErrSaveUploadRecordFailed)
		}

		recordID = upload.ID
		return nil
	}); err != nil {
		if err.Error() == ErrSaveFileFailed {
			c.JSON(http.StatusInternalServerError, util.Err(ErrSaveFileFailed))
			return
		}
		c.JSON(http.StatusInternalServerError, util.Err(ErrSaveUploadRecordFailed))
		return
	}

	c.JSON(http.StatusOK, util.OK(UploadResponse{
		ID: recordID,
	}))
}

// ListRedEnvelopeCovers 获取用户历史红包封面
// @Tags redenvelope
// @Produce json
// @Param type query string true "封面类型 (cover/heterotypic)"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/redenvelope/covers [get]
func ListRedEnvelopeCovers(c *gin.Context) {
	currentUser, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	coverType := c.Query("type")
	if coverType != CoverTypeCover && coverType != CoverTypeHeterotypic {
		c.JSON(http.StatusBadRequest, util.Err(ErrInvalidCoverType))
		return
	}

	var uploads []model.Upload
	if err := db.DB(c.Request.Context()).
		Where("user_id = ? AND status = ? AND type = ?",
			currentUser.ID, model.UploadStatusUsed, coverType).
		Order("created_at DESC").
		Limit(20).
		Find(&uploads).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(ErrQueryHistoryCoverFailed))
		return
	}

	var results []UploadResponse
	for _, u := range uploads {
		results = append(results, UploadResponse{
			ID: u.ID,
		})
	}

	c.JSON(http.StatusOK, util.OK(results))
}
