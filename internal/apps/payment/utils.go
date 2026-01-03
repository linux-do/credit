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

package payment

import (
	"crypto/md5"
	"crypto/subtle"
	"errors"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/common"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/service"
	"github.com/linux-do/credit/internal/util"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// HandleParseOrderNoError 处理 ParseOrderNo 返回的错误，返回对应的 HTTP 响应
func HandleParseOrderNoError(c *gin.Context, err error) bool {
	if err == nil {
		return false
	}

	errMsg := err.Error()
	switch errMsg {
	case OrderNotFound:
		c.JSON(http.StatusNotFound, util.Err(errMsg))
	case MerchantInfoNotFound, PayConfigNotFound:
		c.JSON(http.StatusInternalServerError, util.Err(errMsg))
	case common.CannotPaySelf, common.TestModeCannotProcessOrder, OrderNoFormatError:
		c.JSON(http.StatusBadRequest, util.Err(errMsg))
	case common.UnAuthorized:
		c.JSON(http.StatusUnauthorized, util.Err(errMsg))
	default:
		c.JSON(http.StatusInternalServerError, util.Err(errMsg))
	}
	return true
}

// OrderContext 订单上下文信息
type OrderContext struct {
	OrderID           uint64
	MerchantUser      *model.User
	CurrentUser       *model.User
	PayerPayConfig    *model.UserPayConfig
	MerchantPayConfig *model.UserPayConfig
	MerchantAPIKey    *model.MerchantAPIKey
}

// ParseOrderNo 解析订单号，获取订单上下文信息
func ParseOrderNo(c *gin.Context, orderNo string) (*OrderContext, error) {
	merchantIDStr, errGet := db.Redis.Get(c.Request.Context(), db.PrefixedKey(fmt.Sprintf(OrderMerchantIDCacheKeyFormat, orderNo))).Result()
	if errGet != nil {
		if errors.Is(errGet, redis.Nil) {
			return nil, errors.New(OrderNotFound)
		}
		return nil, errGet
	}

	merchantID, errParse := strconv.ParseUint(merchantIDStr, 10, 64)
	if errParse != nil {
		return nil, errors.New(OrderNoFormatError)
	}

	// 获取商户用户信息
	var merchantUser model.User
	if err := db.DB(c.Request.Context()).Where("id = ? AND is_active = ?", merchantID, true).First(&merchantUser).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New(MerchantInfoNotFound)
		}
		return nil, err
	}

	currentUser, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	orderNoStr, errDecrypt := util.Decrypt(merchantUser.SignKey, orderNo)
	if errDecrypt != nil {
		return nil, errors.New(OrderNoFormatError)
	}

	orderID, errParse := strconv.ParseUint(orderNoStr, 10, 64)
	if errParse != nil {
		return nil, errors.New(OrderNoFormatError)
	}

	var apiKey model.MerchantAPIKey
	if err := db.DB(c.Request.Context()).
		Where("client_id = (SELECT client_id FROM orders WHERE id = ?)", orderID).
		First(&apiKey).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New(OrderNotFound)
		}
		return nil, err
	}

	// 验证测试模式下的支付权限
	if err := service.ValidateTestModePayment(currentUser.ID, merchantUser.ID, apiKey.TestMode); err != nil {
		return nil, err
	}

	ctx := &OrderContext{
		OrderID:        orderID,
		MerchantUser:   &merchantUser,
		CurrentUser:    currentUser,
		MerchantAPIKey: &apiKey,
	}

	// 获取付款用户的支付配置（用于限额检查）
	var payerPayConfig model.UserPayConfig
	if err := payerPayConfig.GetByPayScore(db.DB(c.Request.Context()), currentUser.PayScore); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New(PayConfigNotFound)
		}
		return nil, err
	}
	ctx.PayerPayConfig = &payerPayConfig

	// 获取商家的支付配置（用于手续费倍率）
	var merchantPayConfig model.UserPayConfig
	if err := merchantPayConfig.GetByPayScore(db.DB(c.Request.Context()), merchantUser.PayScore); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New(PayConfigNotFound)
		}
		return nil, err
	}
	ctx.MerchantPayConfig = &merchantPayConfig

	return ctx, nil
}

// GenerateSignature 生成MD5签名
func GenerateSignature(params map[string]string, secret string) string {
	// 按key排序
	keys := make([]string, 0, len(params))
	for k := range params {
		if k == "sign" || k == "sign_type" {
			continue
		}
		// 空值不参与签名
		if params[k] == "" {
			continue
		}
		keys = append(keys, k)
	}

	sort.Strings(keys)

	// 拼接签名字符串
	var builder strings.Builder
	builder.Grow(256)
	for i, k := range keys {
		if i > 0 {
			builder.WriteByte('&')
		}
		builder.WriteString(k)
		builder.WriteByte('=')
		builder.WriteString(params[k])
	}
	builder.WriteString(secret)

	// MD5加密
	hash := md5.Sum([]byte(builder.String()))
	return fmt.Sprintf("%x", hash)
}

// VerifySignature 验证MD5签名
func VerifySignature(c *gin.Context, apiKey *model.MerchantAPIKey) (*CreateOrderRequest, error) {
	var req EPayRequest
	if err := c.ShouldBindWith(&req, binding.FormPost); err != nil {
		return nil, err
	}

	// 验证金额
	if err := util.ValidateAmount(req.Amount); err != nil {
		return nil, err
	}

	if err := apiKey.GetByClientID(db.DB(c.Request.Context()), req.ClientID); err != nil {
		return nil, err
	}

	// 构建签名参数
	params := map[string]string{
		"pid":          req.ClientID,
		"type":         req.PayType,
		"out_trade_no": util.DerefString(req.MerchantOrderNo),
		"notify_url":   req.NotifyURL,
		"return_url":   req.ReturnURL,
		"name":         req.OrderName,
		"money":        req.Amount.Truncate(2).StringFixed(2),
		"device":       req.Device,
	}

	// 生成期望的签名
	expectedSign := GenerateSignature(params, apiKey.ClientSecret)

	// 常量时间比较签名（防止时序攻击）
	if subtle.ConstantTimeCompare([]byte(strings.ToLower(expectedSign)), []byte(strings.ToLower(req.Sign))) != 1 {
		return nil, errors.New("签名验证失败")
	}

	return req.ToCreateOrderRequest(), nil
}
