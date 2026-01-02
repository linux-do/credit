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

package redenvelope

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/common"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
)

// CheckRedEnvelopeEnabled 检查红包功能是否启用的中间件
func CheckRedEnvelopeEnabled() gin.HandlerFunc {
	return func(c *gin.Context) {
		enabled, err := model.GetIntByKey(c.Request.Context(), model.ConfigKeyRedEnvelopeEnabled)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, util.Err(err.Error()))
			return
		}
		if enabled != 1 {
			c.AbortWithStatusJSON(http.StatusForbidden, util.Err(common.RedEnvelopeDisabled))
			return
		}
		c.Next()
	}
}
