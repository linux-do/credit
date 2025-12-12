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

package link

import (
	"crypto/subtle"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/pay/internal/apps/merchant"
	"github.com/linux-do/pay/internal/apps/oauth"
	"github.com/linux-do/pay/internal/common"
	"github.com/linux-do/pay/internal/db"
	"github.com/linux-do/pay/internal/model"
	"github.com/linux-do/pay/internal/service"
	"github.com/linux-do/pay/internal/util"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// PayByLinkRequest 通过支付链接支付请求
type PayByLinkRequest struct {
	Token  string `json:"token" binding:"required"`
	PayKey string `json:"pay_key" binding:"required,max=6"`
	Remark string `json:"remark" binding:"max=100"`
}

// CreatePaymentLinkRequest 创建支付链接请求
type CreatePaymentLinkRequest struct {
	Amount      decimal.Decimal `json:"amount" binding:"required"`
	ProductName string          `json:"product_name" binding:"required,max=30"`
	Remark      string          `json:"remark" binding:"max=100"`
}

// CreatePaymentLink 创建支付链接
// @Tags merchant
// @Accept json
// @Produce json
// @Param id path uint64 true "API Key ID"
// @Param request body CreatePaymentLinkRequest true "创建支付链接请求"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/merchant/api-keys/{id}/payment-links [post]
func CreatePaymentLink(c *gin.Context) {
	var req CreatePaymentLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	// 验证金额
	if req.Amount.LessThanOrEqual(decimal.Zero) {
		c.JSON(http.StatusBadRequest, util.Err(common.AmountMustBeGreaterThanZero))
		return
	}
	if req.Amount.Exponent() < -2 {
		c.JSON(http.StatusBadRequest, util.Err(common.AmountDecimalPlacesExceeded))
		return
	}

	apiKey, _ := util.GetFromContext[*model.MerchantAPIKey](c, merchant.APIKeyObjKey)

	paymentLink := model.MerchantPaymentLink{
		MerchantAPIKeyID: apiKey.ID,
		Token:            util.GenerateUniqueIDSimple(),
		Amount:           req.Amount,
		ProductName:      req.ProductName,
		Remark:           req.Remark,
	}

	if err := db.DB(c.Request.Context()).Create(&paymentLink).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(paymentLink))
}

// PaymentLinkDetail 支付链接详情
type PaymentLinkDetail struct {
	ID          uint64          `json:"id"`
	Token       string          `json:"token"`
	Amount      decimal.Decimal `json:"amount"`
	ProductName string          `json:"product_name"`
	Remark      string          `json:"remark"`
	CreatedAt   time.Time       `json:"created_at"`
	AppName     string          `json:"app_name"`
}

// ListPaymentLinks 获取支付链接列表
// @Tags merchant
// @Produce json
// @Param id path uint64 true "API Key ID"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/merchant/api-keys/{id}/payment-links [get]
func ListPaymentLinks(c *gin.Context) {
	apiKey, _ := util.GetFromContext[*model.MerchantAPIKey](c, merchant.APIKeyObjKey)

	var paymentLinks []PaymentLinkDetail
	if err := db.DB(c.Request.Context()).
		Table("merchant_payment_links").
		Select("merchant_payment_links.id, merchant_payment_links.token, merchant_payment_links.amount, merchant_payment_links.product_name, merchant_payment_links.remark, merchant_payment_links.created_at, merchant_api_keys.app_name").
		Joins("JOIN merchant_api_keys ON merchant_api_keys.id = merchant_payment_links.merchant_api_key_id").
		Where("merchant_payment_links.merchant_api_key_id = ? AND merchant_payment_links.deleted_at IS NULL", apiKey.ID).
		Order("merchant_payment_links.created_at DESC").
		Find(&paymentLinks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(paymentLinks))
}

// GetPaymentLinkByToken 通过 Token 查询支付链接信息
// @Tags merchant
// @Produce json
// @Param token path string true "支付链接 Token"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/merchant/payment-links/{token} [get]
func GetPaymentLinkByToken(c *gin.Context) {
	var paymentLink PaymentLinkDetail
	if err := db.DB(c.Request.Context()).
		Table("merchant_payment_links").
		Select("merchant_payment_links.id, merchant_payment_links.token, merchant_payment_links.amount, merchant_payment_links.product_name, merchant_payment_links.remark, merchant_payment_links.created_at, merchant_api_keys.app_name").
		Joins("JOIN merchant_api_keys ON merchant_api_keys.id = merchant_payment_links.merchant_api_key_id").
		Where("merchant_payment_links.token = ? AND merchant_payment_links.deleted_at IS NULL", c.Param("token")).
		First(&paymentLink).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, util.Err(PaymentLinkNotFound))
		} else {
			c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		}
		return
	}

	c.JSON(http.StatusOK, util.OK(paymentLink))
}

// DeletePaymentLink 删除支付链接
// @Tags merchant
// @Produce json
// @Param id path uint64 true "API Key ID"
// @Param linkId path uint64 true "Payment Link ID"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/merchant/api-keys/{id}/payment-links/{linkId} [delete]
func DeletePaymentLink(c *gin.Context) {
	apiKey, _ := util.GetFromContext[*model.MerchantAPIKey](c, merchant.APIKeyObjKey)
	linkID := c.Param("linkId")

	result := db.DB(c.Request.Context()).
		Where("id = ? AND merchant_api_key_id = ?", linkID, apiKey.ID).
		Delete(&model.MerchantPaymentLink{})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, util.Err(result.Error.Error()))
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, util.Err(PaymentLinkNotFound))
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}

// PayByLink 通过支付链接支付
// @Tags merchant
// @Accept json
// @Produce json
// @Param request body PayByLinkRequest true "支付请求"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/merchant/payment-links/pay [post]
func PayByLink(c *gin.Context) {
	var req PayByLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	var paymentLink model.MerchantPaymentLink
	if err := paymentLink.GetByToken(db.DB(c.Request.Context()), req.Token); err != nil {
		c.AbortWithStatusJSON(http.StatusNotFound, util.Err(PaymentLinkNotFound))
		return
	}

	currentUser, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	if subtle.ConstantTimeCompare([]byte(currentUser.PayKey), []byte(req.PayKey)) != 1 {
		c.JSON(http.StatusBadRequest, util.Err(common.PayKeyIncorrect))
		return
	}

	// 检查余额是否足够
	if currentUser.AvailableBalance.LessThan(paymentLink.Amount) {
		c.JSON(http.StatusBadRequest, util.Err(common.InsufficientBalance))
		return
	}

	// 查询商户 API Key
	var merchantAPIKey model.MerchantAPIKey
	if err := merchantAPIKey.GetByID(db.DB(c.Request.Context()), paymentLink.MerchantAPIKeyID); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	// 查询商户用户
	var merchantUser model.User
	if err := merchantUser.GetByID(db.DB(c.Request.Context()), merchantAPIKey.UserID); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	// 不能给自己付款
	if currentUser.ID == merchantUser.ID {
		c.JSON(http.StatusBadRequest, util.Err(common.CannotPaySelf))
		return
	}

	// 获取商户的支付配置
	var merchantPayConfig model.UserPayConfig
	if err := merchantPayConfig.GetByPayScore(db.DB(c.Request.Context()), merchantUser.PayScore); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	// 获取付款方的支付配置
	var payerPayConfig model.UserPayConfig
	if err := payerPayConfig.GetByPayScore(db.DB(c.Request.Context()), currentUser.PayScore); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	if err := db.DB(c.Request.Context()).Transaction(
		func(tx *gorm.DB) error {
			// 检查每日限额
			if err := service.CheckDailyLimit(tx, currentUser.ID, paymentLink.Amount, payerPayConfig.DailyLimit); err != nil {
				return err
			}

			// 计算手续费
			_, merchantAmount, feePercent := service.CalculateFee(paymentLink.Amount, merchantPayConfig.FeeRate)
			feeRemark := fmt.Sprintf("[系统]: 收取商家%d%%手续费", feePercent)

			remark := req.Remark
			if remark != "" {
				remark = remark + " " + feeRemark
			} else {
				remark = feeRemark
			}

			// 创建订单
			order := model.Order{
				OrderName:   paymentLink.ProductName,
				PayerUserID: currentUser.ID,
				PayeeUserID: merchantUser.ID,
				ClientID:    merchantAPIKey.ClientID,
				Amount:      paymentLink.Amount,
				Status:      model.OrderStatusSuccess,
				Type:        model.OrderTypePayment,
				Remark:      remark,
				TradeTime:   time.Now(),
				ExpiresAt:   time.Now(),
			}
			if err := tx.Create(&order).Error; err != nil {
				return err
			}

			// 扣减用户余额
			if err := service.DeductUserBalance(tx, currentUser.ID, paymentLink.Amount); err != nil {
				return err
			}

			// 增加商户余额和积分
			merchantScoreIncrease := paymentLink.Amount.Mul(merchantPayConfig.ScoreRate).Round(0).IntPart()
			if err := service.AddMerchantBalance(tx, merchantUser.ID, merchantAmount, merchantScoreIncrease); err != nil {
				return err
			}

			return nil
		},
	); err != nil {
		errMsg := err.Error()
		switch errMsg {
		case common.InsufficientBalance:
			c.JSON(http.StatusBadRequest, util.Err(common.InsufficientBalance))
		case common.DailyLimitExceeded:
			c.JSON(http.StatusBadRequest, util.Err(common.DailyLimitExceeded))
		default:
			c.JSON(http.StatusInternalServerError, util.Err(errMsg))
		}
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}
