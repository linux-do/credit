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
	"errors"
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/logger"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/storage"
	"gorm.io/gorm"
)

// ServeFileByID serves an uploaded file by its ID
// @Tags upload
// @Produce octet-stream
// @Param id path string true "Upload ID"
// @Success 200
// @Router /f/{id} [get]
func ServeFileByID(c *gin.Context) {
	idStr := c.Param("id")
	uploadID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid upload ID"})
		return
	}

	var upload model.Upload
	if err := db.DB(c.Request.Context()).
		Where("id = ? AND status IN (?, ?)", uploadID, model.UploadStatusPending, model.UploadStatusUsed).
		First(&upload).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// Retrieve file from S3 (via CDN if configured)
	obj, err := storage.GetObjectViaCache(c.Request.Context(), upload.FilePath)
	if err != nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	// Cachefile
	if obj.CachePath != "" {
		c.File(obj.CachePath)
		return
	}

	// Stream from CDN/S3
	defer obj.Body.Close()

	// no cache control, use cdn cache settings if available
	c.Header("Content-Type", obj.ContentType)
	if obj.ContentLength > 0 {
		c.Header("Content-Length", strconv.FormatInt(obj.ContentLength, 10))
	}

	c.Status(http.StatusOK)
	if _, err := io.Copy(c.Writer, obj.Body); err != nil {
		logger.ErrorF(c.Request.Context(), "Failed to serve file for upload ID %d: %v", uploadID, err)
	}
}
