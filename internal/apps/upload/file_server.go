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
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
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

	// Open the file
	file, err := os.Open(upload.FilePath)
	if err != nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}
	defer file.Close()

	// Get file info
	info, err := file.Stat()
	if err != nil || info.IsDir() {
		c.AbortWithStatus(http.StatusForbidden)
		return
	}

	// Set caching headers (7 days)
	c.Header("Cache-Control", "public, max-age=604800, immutable")

	// Serve the file with proper content type detection
	http.ServeContent(c.Writer, c.Request, info.Name(), info.ModTime(), file)
}
