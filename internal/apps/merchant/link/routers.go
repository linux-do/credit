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

package link

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/apps/merchant"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/common"
	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/service"
	"github.com/linux-do/credit/internal/util"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// PayByLinkRequest 通过支付链接支付请求
type PayByLinkRequest struct {
	Token  string `json:"token" binding:"required"`
	PayKey string `json:"pay_key" binding:"required,max=6"`
	Remark string `json:"remark" binding:"max=100"`
}

// PaymentLinkRequest 创建支付链接请求
type PaymentLinkRequest struct {
	Amount      decimal.Decimal `json:"amount" binding:"required"`
	ProductName string          `json:"product_name" binding:"required,max=30"`
	Remark      string          `json:"remark" binding:"max=100"`
	TotalLimit  *uint           `json:"total_limit" binding:"omitempty,min=1"`
	UserLimit   *uint           `json:"user_limit" binding:"omitempty,min=1"`
}

// CreatePaymentLink 创建支付链接
// @Tags merchant
// @Accept json
// @Produce json
// @Param id path uint64 true "API Key ID"
// @Param request body PaymentLinkRequest true "创建支付链接请求"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/merchant/api-keys/{id}/payment-links [post]
func CreatePaymentLink(c *gin.Context) {
	var req PaymentLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	// 验证金额
	if err := util.ValidateAmount(req.Amount); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	apiKey, _ := util.GetFromContext[*model.MerchantAPIKey](c, merchant.APIKeyObjKey)

	paymentLink := model.MerchantPaymentLink{
		MerchantAPIKeyID: apiKey.ID,
		Token:            util.GenerateUniqueIDSimple(),
		Amount:           req.Amount,
		ProductName:      req.ProductName,
		Remark:           req.Remark,
		TotalLimit:       req.TotalLimit,
		UserLimit:        req.UserLimit,
	}

	if err := db.DB(c.Request.Context()).Create(&paymentLink).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(paymentLink))
}

// PaymentLinkDetail 支付链接详情
type PaymentLinkDetail struct {
	ID          uint64          `json:"id,string"`
	Token       string          `json:"token"`
	Amount      decimal.Decimal `json:"amount"`
	ProductName string          `json:"product_name"`
	Remark      string          `json:"remark"`
	TotalLimit  *uint           `json:"total_limit"`
	UserLimit   *uint           `json:"user_limit"`
	CreatedAt   time.Time       `json:"created_at"`
	AppName     string          `json:"app_name"`
	RedirectURI string          `json:"redirect_uri"`
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
		Select("merchant_payment_links.id, merchant_payment_links.token, merchant_payment_links.amount, merchant_payment_links.product_name, merchant_payment_links.remark, merchant_payment_links.total_limit, merchant_payment_links.user_limit, merchant_payment_links.created_at, merchant_api_keys.app_name, merchant_api_keys.redirect_uri").
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
		Select("merchant_payment_links.id, merchant_payment_links.token, merchant_payment_links.amount, merchant_payment_links.product_name, merchant_payment_links.remark, merchant_payment_links.created_at, merchant_api_keys.app_name, merchant_api_keys.redirect_uri").
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

// UpdatePaymentLink 更新支付链接
// @Tags merchant
// @Accept json
// @Produce json
// @Param id path uint64 true "API Key ID"
// @Param linkId path uint64 true "Payment Link ID"
// @Param request body PaymentLinkRequest true "更新支付链接请求"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/merchant/api-keys/{id}/payment-links/{linkId} [put]
func UpdatePaymentLink(c *gin.Context) {
	var req PaymentLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	// 验证金额
	if err := util.ValidateAmount(req.Amount); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	apiKey, _ := util.GetFromContext[*model.MerchantAPIKey](c, merchant.APIKeyObjKey)
	linkID := c.Param("linkId")

	result := db.DB(c.Request.Context()).
		Model(&model.MerchantPaymentLink{}).
		Where("id = ? AND merchant_api_key_id = ?", linkID, apiKey.ID).
		Updates(map[string]interface{}{
			"amount":       req.Amount,
			"product_name": req.ProductName,
			"remark":       req.Remark,
			"total_limit":  req.TotalLimit,
			"user_limit":   req.UserLimit,
		})

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

	if !currentUser.VerifyPayKey(req.PayKey) {
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

	// 验证测试模式下的支付权限
	if err := service.ValidateTestModePayment(currentUser.ID, merchantUser.ID, merchantAPIKey.TestMode); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
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

	isTestMode := merchantAPIKey.TestMode

	if err := db.DB(c.Request.Context()).Transaction(
		func(tx *gorm.DB) error {
			// 非测试模式
			if !isTestMode {
				if paymentLink.TotalLimit != nil || paymentLink.UserLimit != nil {
					if err := tx.Exec("SELECT pg_advisory_xact_lock(?)", paymentLink.ID).Error; err != nil {
						return err
					}
				}

				// 检查总付款次数限制
				if paymentLink.TotalLimit != nil {
					var totalCount int64
					if err := tx.Table("orders").
						Where("payment_link_id = ? AND status = ?", paymentLink.ID, model.OrderStatusSuccess).
						Count(&totalCount).Error; err != nil {
						return err
					}
					if totalCount >= int64(*paymentLink.TotalLimit) {
						return errors.New(PaymentLinkTotalLimitExceeded)
					}
				}

				// 检查单用户付款次数限制
				if paymentLink.UserLimit != nil {
					var userCount int64
					if err := tx.Table("orders").
						Where("payment_link_id = ? AND status = ? AND payer_user_id = ?",
							paymentLink.ID, model.OrderStatusSuccess, currentUser.ID).
						Count(&userCount).Error; err != nil {
						return err
					}
					if userCount >= int64(*paymentLink.UserLimit) {
						return errors.New(PaymentLinkUserLimitExceeded)
					}
				}

				// 检查每日限额
				if err := service.CheckDailyLimit(tx, currentUser.ID, paymentLink.Amount, payerPayConfig.DailyLimit); err != nil {
					return err
				}
			}

			// 计算手续费
			_, merchantAmount, feePercent := service.CalculateFee(paymentLink.Amount, merchantPayConfig.FeeRate)

			var remark string
			var orderType model.OrderType
			var paymentLinkID *uint64

			if isTestMode {
				remark = common.TestModeOrderRemark
				orderType = model.OrderTypeTest
			} else {
				feeRemark := fmt.Sprintf("[系统]: 收取商家%d%%手续费", feePercent)
				if req.Remark != "" {
					remark = req.Remark + " " + feeRemark
				} else {
					remark = feeRemark
				}
				orderType = model.OrderTypeOnline
				paymentLinkID = &paymentLink.ID
			}

			// 创建订单
			order := model.Order{
				OrderName:     paymentLink.ProductName,
				PayerUserID:   currentUser.ID,
				PayeeUserID:   merchantUser.ID,
				ClientID:      merchantAPIKey.ClientID,
				Amount:        paymentLink.Amount,
				Status:        model.OrderStatusSuccess,
				Type:          orderType,
				Remark:        remark,
				PaymentLinkID: paymentLinkID,
				TradeTime:     time.Now(),
				ExpiresAt:     time.Now(),
			}
			if err := tx.Create(&order).Error; err != nil {
				return err
			}

			// 非测试模式：扣减用户余额和增加商户余额
			if !isTestMode {
				if err := service.UpdateBalance(tx, service.BalanceUpdateOptions{
					UserID:       currentUser.ID,
					Amount:       paymentLink.Amount,
					Operation:    service.BalanceDeduct,
					ScoreChange:  paymentLink.Amount.Round(0).IntPart(),
					TotalField:   "total_payment",
					CheckBalance: true,
				}); err != nil {
					return err
				}

				merchantScoreIncrease := paymentLink.Amount.Mul(merchantPayConfig.ScoreRate).Round(0).IntPart()
				if err := service.UpdateBalance(tx, service.BalanceUpdateOptions{
					UserID:       merchantUser.ID,
					Amount:       merchantAmount,
					Operation:    service.BalanceAdd,
					ScoreChange:  merchantScoreIncrease,
					TotalField:   "total_receive",
					CheckBalance: false,
				}); err != nil {
					return err
				}
			}

			if config.Config.App.IsProduction() && util.IsLocalhost(merchantAPIKey.NotifyURL) {
				return nil
			}

			return service.EnqueueMerchantNotify(order.ID, merchantAPIKey.ClientID)
		},
	); err != nil {
		errMsg := err.Error()
		switch errMsg {
		case common.InsufficientBalance, common.DailyLimitExceeded,
			PaymentLinkTotalLimitExceeded, PaymentLinkUserLimitExceeded:
			c.JSON(http.StatusBadRequest, util.Err(errMsg))
		default:
			c.JSON(http.StatusInternalServerError, util.Err(errMsg))
		}
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}
