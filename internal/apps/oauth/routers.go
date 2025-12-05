/*
 * MIT License
 *
 * Copyright (c) 2025 linux.do
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

package oauth

import (
	"fmt"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/linux-do/pay/internal/db"
	"github.com/linux-do/pay/internal/logger"
	"github.com/linux-do/pay/internal/model"
	"github.com/linux-do/pay/internal/util"
	"github.com/shopspring/decimal"
)

// GetLoginURL godoc
// @Tags oauth
// @Produce json
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/oauth/login [get]
func GetLoginURL(c *gin.Context) {
	// 存储 State 到缓存
	state := uuid.NewString()
	cmd := db.Redis.Set(c.Request.Context(), fmt.Sprintf(OAuthStateCacheKeyFormat, state), state, OAuthStateCacheKeyExpiration)
	if cmd.Err() != nil {
		c.JSON(http.StatusInternalServerError, util.Err(cmd.Err().Error()))
		return
	}
	// 构造登录 URL
	c.JSON(http.StatusOK, util.OK(oauthConf.AuthCodeURL(state)))
}

type CallbackRequest struct {
	State string `json:"state"`
	Code  string `json:"code"`
}

// Callback godoc
// @Tags oauth
// @Param request body CallbackRequest true "request body"
// @Produce json
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/oauth/callback [post]
func Callback(c *gin.Context) {
	// init req
	var req CallbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}
	// check state
	cmd := db.Redis.Get(c.Request.Context(), fmt.Sprintf(OAuthStateCacheKeyFormat, req.State))
	if cmd.Val() != req.State {
		c.JSON(http.StatusBadRequest, util.Err(InvalidState))
		return
	}
	db.Redis.Del(c.Request.Context(), fmt.Sprintf(OAuthStateCacheKeyFormat, req.State))
	// do oauth
	user, err := doOAuth(c.Request.Context(), req.Code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}
	// bind to session
	session := sessions.Default(c)
	session.Set(UserIDKey, user.ID)
	session.Set(UserNameKey, user.Username)
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}
	// response
	c.JSON(http.StatusOK, util.OKNil())
	logger.InfoF(c.Request.Context(), "[OAuthCallback] %d %s", user.ID, user.Username)
}

type BasicUserInfo struct {
	ID               uint64           `json:"id"`
	Username         string           `json:"username"`
	Nickname         string           `json:"nickname"`
	TrustLevel       model.TrustLevel `json:"trust_level"`
	AvatarUrl        string           `json:"avatar_url"`
	TotalReceive     decimal.Decimal  `json:"total_receive"`
	TotalPayment     decimal.Decimal  `json:"total_payment"`
	TotalTransfer    decimal.Decimal  `json:"total_transfer"`
	TotalCommunity   decimal.Decimal  `json:"total_community"`
	AvailableBalance decimal.Decimal  `json:"available_balance"`
	PayScore         int64            `json:"pay_score"`
	IsPayKey         bool             `json:"is_pay_key"`
	IsAdmin          bool             `json:"is_admin"`
	RemainQuota      int64            `json:"remain_quota"`
	PayLevel         model.PayLevel   `json:"pay_level"`
	DailyLimit       *int64           `json:"daily_limit"`
}

// UserInfo godoc
// @Tags oauth
// @Produce json
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/oauth/user-info [get]
func UserInfo(c *gin.Context) {
	user, _ := util.GetFromContext[*model.User](c, UserObjKey)

	var payConfig model.UserPayConfig
	if err := payConfig.GetByPayScore(db.DB(c.Request.Context()), user.PayScore); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(
		http.StatusOK,
		util.OK(BasicUserInfo{
			ID:               user.ID,
			Username:         user.Username,
			Nickname:         user.Nickname,
			TrustLevel:       user.TrustLevel,
			AvatarUrl:        user.AvatarUrl,
			TotalReceive:     user.TotalReceive,
			TotalPayment:     user.TotalPayment,
			TotalTransfer:    user.TotalTransfer,
			TotalCommunity:   user.TotalCommunity,
			AvailableBalance: user.AvailableBalance,
			PayScore:         user.PayScore,
			IsPayKey:         user.PayKey != "",
			IsAdmin:          user.IsAdmin,
			RemainQuota:      0,
			PayLevel:         payConfig.Level,
			DailyLimit:       payConfig.DailyLimit,
		}),
	)
}

// Logout godoc
// @Tags oauth
// @Produce json
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/oauth/logout [get]
func Logout(c *gin.Context) {
	session := sessions.Default(c)
	session.Clear()
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, util.OKNil())
}
