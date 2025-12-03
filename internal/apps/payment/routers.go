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

package payment

import (
	"crypto/subtle"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/linux-do/pay/internal/apps/oauth"
	"github.com/linux-do/pay/internal/config"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/pay/internal/db"
	"github.com/linux-do/pay/internal/model"
	"github.com/linux-do/pay/internal/util"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// CreateOrderRequest 商户创建订单请求
type CreateOrderRequest struct {
	OrderName string          `json:"order_name" binding:"required,max=64"`
	Amount    decimal.Decimal `json:"amount" binding:"required"`
	Remark    string          `json:"remark" binding:"max=200"`
}

// CreateOrderResponse 创建订单响应
type CreateOrderResponse struct {
	OrderID uint64 `json:"order_id"`
	PayURL  string `json:"pay_url"`
}

// PayOrderRequest 用户支付订单请求
type PayOrderRequest struct {
	OrderNo string `json:"order_no" binding:"required"`
	PayKey  string `json:"pay_key" binding:"required,max=10"`
}

// GetOrderRequest 查询订单请求
type GetOrderRequest struct {
	OrderNo string `form:"order_no" json:"order_no" binding:"required"`
}

// MerchantInfo 商户信息
type MerchantInfo struct {
	AppName string `json:"app_name"`
}

// GetOrderResponse 查询订单响应
type GetOrderResponse struct {
	Order    *model.Order    `json:"order"`
	FeeRate  decimal.Decimal `json:"fee_rate"`
	Merchant MerchantInfo    `json:"merchant"`
}

// TransferRequest 转账请求
type TransferRequest struct {
	RecipientID       uint64          `json:"recipient_id" binding:"required"`
	RecipientUsername string          `json:"recipient_username" binding:"required"`
	Amount            decimal.Decimal `json:"amount" binding:"required"`
	PayKey            string          `json:"pay_key" binding:"required"`
	Remark            string          `json:"remark"`
}

// CreateMerchantOrder 商户创建订单接口
// @Tags payment
// @Accept json
// @Produce json
// @Param Authorization header string true "Basic {ClientID}:{ClientSecret}"
// @Param request body CreateOrderRequest true "request body"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/merchant/payment/orders [post]
func CreateMerchantOrder(c *gin.Context) {
	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	// 验证金额必须大于0
	if req.Amount.LessThanOrEqual(decimal.Zero) {
		c.JSON(http.StatusBadRequest, util.Err(AmountMustBeGreaterThanZero))
		return
	}

	// 验证小数位数不超过2位
	if req.Amount.Exponent() < -2 {
		c.JSON(http.StatusBadRequest, util.Err(AmountDecimalPlacesExceeded))
		return
	}

	apiKey, _ := GetAPIKeyFromContext(c)

	// 获取商户用户信息
	var merchantUser model.User
	if err := db.DB(c.Request.Context()).Where("id = ? AND is_active = ?", apiKey.UserID, true).First(&merchantUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(MerchantInfoNotFound))
		return
	}

	// 获取商家订单过期时间（分钟）
	expireMinutes, errGet := model.GetIntByKey(c.Request.Context(), model.ConfigKeyMerchantOrderExpireMinutes)
	if errGet != nil {
		c.JSON(http.StatusInternalServerError, util.Err(errGet.Error()))
		return
	}

	var response CreateOrderResponse

	if err := db.DB(c.Request.Context()).Transaction(
		func(tx *gorm.DB) error {
			// 创建订单
			order := model.Order{
				OrderName:   req.OrderName,
				ClientID:    apiKey.ClientID,
				PayeeUserID: merchantUser.ID,
				Amount:      req.Amount,
				Status:      model.OrderStatusPending,
				Type:        model.OrderTypePayment,
				Remark:      req.Remark,
				ExpiresAt:   time.Now().Add(time.Duration(expireMinutes) * time.Minute),
			}
			if err := tx.Create(&order).Error; err != nil {
				return err
			}

			encryptString, err := util.Encrypt(merchantUser.SignKey, strconv.FormatUint(order.ID, 10))
			if err != nil {
				return err
			}

			merchantIDStr := strconv.FormatUint(merchantUser.ID, 10)
			if errSet := db.Redis.Set(c.Request.Context(), fmt.Sprintf(OrderMerchantIDCacheKeyFormat, encryptString), merchantIDStr, time.Duration(expireMinutes)*time.Minute).Err(); errSet != nil {
				return fmt.Errorf("failed to set redis key: %w", errSet)
			}

			expireKey := fmt.Sprintf(OrderExpireKeyFormat, order.ID)
			if errSet := db.Redis.Set(c.Request.Context(), expireKey, order.ID, time.Duration(expireMinutes)*time.Minute).Err(); errSet != nil {
				return fmt.Errorf("failed to set order expire key: %w", errSet)
			}

			response.OrderID = order.ID
			response.PayURL = fmt.Sprintf("%s?order_no=%s", config.Config.App.FrontendPayURL, url.QueryEscape(encryptString))
			return nil
		},
	); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(response))
}

// GetMerchantOrder 查询支付订单信息接口
// @Tags payment
// @Accept json
// @Produce json
// @Param order_no query string true "订单号"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/merchant/payment/order [get]
func GetMerchantOrder(c *gin.Context) {
	var req GetOrderRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	orderCtx, errCtx := ParseOrderNo(c, req.OrderNo)
	if HandleParseOrderNoError(c, errCtx) {
		return
	}

	var order model.Order
	if err := db.DB(c.Request.Context()).
		Select("orders.*, payee_user.username as payee_username").
		Joins("LEFT JOIN users as payee_user ON orders.payee_user_id = payee_user.id").
		Where("orders.id = ? AND orders.status = ?", orderCtx.OrderID, model.OrderStatusPending).
		First(&order).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, util.Err(OrderNotFound))
			return
		}
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}
	order.PayerUsername = orderCtx.CurrentUser.Username

	var merchant model.MerchantAPIKey
	if err := db.DB(c.Request.Context()).
		Where("client_id = ?", order.ClientID).
		First(&merchant).Error; err != nil {
		c.JSON(http.StatusNotFound, util.Err(MerchantInfoNotFound))
		return
	}

	c.JSON(http.StatusOK, util.OK(GetOrderResponse{
		Order:   &order,
		FeeRate: orderCtx.MerchantPayConfig.FeeRate,
		Merchant: MerchantInfo{
			AppName: merchant.AppName,
		},
	}))
}

// PayMerchantOrder 用户支付订单接口
// @Tags payment
// @Accept json
// @Produce json
// @Param request body PayOrderRequest true "支付订单请求"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/merchant/payment [post]
func PayMerchantOrder(c *gin.Context) {
	var req PayOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}
	orderCtx, errCtx := ParseOrderNo(c, req.OrderNo)
	if HandleParseOrderNoError(c, errCtx) {
		return
	}

	if subtle.ConstantTimeCompare([]byte(orderCtx.CurrentUser.PayKey), []byte(req.PayKey)) != 1 {
		c.JSON(http.StatusBadRequest, util.Err(PayKeyIncorrect))
		return
	}

	if err := db.DB(c.Request.Context()).Transaction(
		func(tx *gorm.DB) error {
			var order model.Order
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "NOWAIT"}).
				Where("id = ? AND status = ?", orderCtx.OrderID, model.OrderStatusPending).
				First(&order).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return errors.New(OrderNotFound)
				}
				return err
			}

			// 检查订单是否过期
			if order.ExpiresAt.Before(time.Now()) {
				return errors.New(OrderExpired)
			}

			// 查询当前用户余额（确保数据最新）
			var currentUserInTx model.User
			if err := tx.Where("id = ?", orderCtx.CurrentUser.ID).First(&currentUserInTx).Error; err != nil {
				return err
			}

			// 检查余额是否足够
			if currentUserInTx.AvailableBalance.LessThan(order.Amount) {
				return errors.New(InsufficientBalance)
			}

			// 检查每日限额
			if orderCtx.PayerPayConfig.DailyLimit != nil && *orderCtx.PayerPayConfig.DailyLimit > 0 {
				now := time.Now()
				datePart := int64(now.Year()*10000 + int(now.Month())*100 + now.Day())
				// 使用 100000000 (1亿) 作为乘数，确保日期部分（8位）不会与用户ID冲突
				lockID := int64(orderCtx.CurrentUser.ID)*100000000 + datePart

				if err := tx.Exec("SELECT pg_advisory_xact_lock(?)", lockID).Error; err != nil {
					return err
				}

				// 获取今天的开始和结束时间
				todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
				todayEnd := todayStart.Add(24 * time.Hour)

				// 统计当日成功支付的订单总金额
				var todayTotalAmount decimal.Decimal
				if err := tx.Model(&model.Order{}).
					Where("payer_user_id = ? AND status = ? AND type = ? AND trade_time >= ? AND trade_time < ?",
						orderCtx.CurrentUser.ID,
						model.OrderStatusSuccess,
						model.OrderTypePayment,
						todayStart,
						todayEnd).
					Select("COALESCE(SUM(amount), 0)").
					Scan(&todayTotalAmount).Error; err != nil {
					return err
				}

				// 检查当日总金额 + 当前订单金额是否超过限额
				dailyLimitDecimal := decimal.NewFromInt(*orderCtx.PayerPayConfig.DailyLimit)
				if todayTotalAmount.Add(order.Amount).GreaterThan(dailyLimitDecimal) {
					return errors.New(DailyLimitExceeded)
				}
			}

			// 计算手续费：订单金额 * 商家的费率，保留两位小数
			fee := order.Amount.Mul(orderCtx.MerchantPayConfig.FeeRate).Round(2)
			// 商户实际收到金额：订单金额 - 手续费
			merchantAmount := order.Amount.Sub(fee)

			feePercent := orderCtx.MerchantPayConfig.FeeRate.Mul(decimal.NewFromInt(100)).IntPart()
			feeRemark := fmt.Sprintf("[系统]: 收取商家%d%%手续费", feePercent)

			// 更新订单状态和备注
			if order.Remark != "" {
				order.Remark = order.Remark + " " + feeRemark
			} else {
				order.Remark = feeRemark
			}
			order.Status = model.OrderStatusSuccess
			order.PayerUserID = orderCtx.CurrentUser.ID
			order.TradeTime = time.Now()
			if err := tx.Save(&order).Error; err != nil {
				return err
			}

			// 扣减用户余额
			result := tx.Model(&model.User{}).
				Where("id = ? AND available_balance >= ?", orderCtx.CurrentUser.ID, order.Amount).
				UpdateColumns(map[string]interface{}{
					"available_balance": gorm.Expr("available_balance - ?", order.Amount),
					"total_payment":     gorm.Expr("total_payment + ?", order.Amount),
					"pay_score":         gorm.Expr("pay_score + ?", order.Amount.Round(0).IntPart()),
				})
			if result.Error != nil {
				return result.Error
			}

			// 检查是否成功扣减
			if result.RowsAffected == 0 {
				return errors.New(InsufficientBalance)
			}

			// 增加商户余额和积分
			merchantScoreIncrease := order.Amount.Mul(orderCtx.MerchantPayConfig.ScoreRate).Round(0).IntPart()
			if err := tx.Model(&model.User{}).
				Where("id = ?", orderCtx.MerchantUser.ID).
				UpdateColumns(map[string]interface{}{
					"available_balance": gorm.Expr("available_balance + ?", merchantAmount),
					"total_receive":     gorm.Expr("total_receive + ?", merchantAmount),
					"pay_score":         gorm.Expr("pay_score + ?", merchantScoreIncrease),
				}).Error; err != nil {
				return err
			}

			expireKey := fmt.Sprintf(OrderExpireKeyFormat, order.ID)
			if err := db.Redis.Del(c.Request.Context(), expireKey).Err(); err != nil {
				log.Printf("[Payment] 删除订单过期key失败: order_id=%d, error=%v", order.ID, err)
			}

			return nil
		},
	); err != nil {
		errMsg := err.Error()
		if errMsg == InsufficientBalance {
			c.JSON(http.StatusBadRequest, util.Err(InsufficientBalance))
		} else if errMsg == OrderNotFound {
			c.JSON(http.StatusNotFound, util.Err(OrderNotFound))
		} else if errMsg == OrderExpired {
			c.JSON(http.StatusBadRequest, util.Err(OrderExpired))
		} else if errMsg == DailyLimitExceeded {
			c.JSON(http.StatusBadRequest, util.Err(DailyLimitExceeded))
		} else {
			c.JSON(http.StatusInternalServerError, util.Err(errMsg))
		}
		return
	}

	// 异步回调商户
	//go notifyMerchant(c.Request.Context(), &order)

	c.JSON(http.StatusOK, util.OKNil())
}

// Transfer 用户转账接口
// @Tags payment
// @Accept json
// @Produce json
// @Param request body TransferRequest true "转账请求"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/payment/transfer [post]
func Transfer(c *gin.Context) {
	var req TransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	if req.Amount.LessThanOrEqual(decimal.Zero) {
		c.JSON(http.StatusBadRequest, util.Err(AmountMustBeGreaterThanZero))
		return
	}

	if req.Amount.Exponent() < -2 {
		c.JSON(http.StatusBadRequest, util.Err(AmountDecimalPlacesExceeded))
		return
	}

	currentUser, _ := oauth.GetUserFromContext(c)

	if subtle.ConstantTimeCompare([]byte(currentUser.PayKey), []byte(req.PayKey)) != 1 {
		c.JSON(http.StatusBadRequest, util.Err(PayKeyIncorrect))
		return
	}

	if currentUser.ID == req.RecipientID && currentUser.Username == req.RecipientUsername {
		c.JSON(http.StatusBadRequest, util.Err(CannotTransferToSelf))
		return
	}

	if err := db.DB(c.Request.Context()).Transaction(
		func(tx *gorm.DB) error {
			// 验证收款人是否存在且用户名匹配
			var recipient model.User
			if err := tx.Where("id = ? AND username = ?", req.RecipientID, req.RecipientUsername).First(&recipient).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return errors.New(RecipientNotFound)
				}
				return err
			}

			var payer model.User
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "NOWAIT"}).
				Where("id = ?", currentUser.ID).
				First(&payer).Error; err != nil {
				return err
			}

			if payer.AvailableBalance.LessThan(req.Amount) {
				return errors.New(InsufficientBalance)
			}

			// 创建转账订单
			order := model.Order{
				OrderName:   "转账",
				PayerUserID: payer.ID,
				PayeeUserID: recipient.ID,
				Amount:      req.Amount,
				Status:      model.OrderStatusSuccess,
				Type:        model.OrderTypeTransfer,
				Remark:      req.Remark,
				TradeTime:   time.Now(),
				ExpiresAt:   time.Now().Add(24 * time.Hour),
			}

			if err := tx.Create(&order).Error; err != nil {
				return err
			}

			// 扣减付款人余额
			if err := tx.Model(&model.User{}).
				Where("id = ?", payer.ID).
				UpdateColumns(map[string]interface{}{
					"available_balance": gorm.Expr("available_balance - ?", req.Amount),
					"total_transfer":    gorm.Expr("total_transfer + ?", req.Amount),
				}).Error; err != nil {
				return err
			}

			// 增加收款人余额
			if err := tx.Model(&model.User{}).
				Where("id = ?", recipient.ID).
				UpdateColumns(map[string]interface{}{
					"available_balance": gorm.Expr("available_balance + ?", req.Amount),
					"total_receive":     gorm.Expr("total_receive + ?", req.Amount),
				}).Error; err != nil {
				return err
			}

			return nil
		},
	); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}
