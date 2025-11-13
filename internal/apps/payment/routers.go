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
	"net/http"
	"net/url"
	"strconv"
	"time"

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

// GetOrderResponse 查询订单响应
type GetOrderResponse struct {
	Order         *model.Order         `json:"order"`
	UserPayConfig *model.UserPayConfig `json:"user_pay_config"`
}

// CreateMerchantOrder 商户创建订单接口
// @Tags payment
// @Accept json
// @Produce json
// @Param Authorization header string true "Bearer {ClientID}:{ClientSecret}"
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

	var response CreateOrderResponse

	if err := db.DB(c.Request.Context()).Transaction(
		func(tx *gorm.DB) error {
			// 创建订单
			order := model.Order{
				OrderName:     req.OrderName,
				ClientID:      apiKey.ClientID,
				PayeeUsername: merchantUser.Username,
				Amount:        req.Amount,
				Status:        model.OrderStatusPending,
				Type:          model.OrderTypePayment,
				Remark:        req.Remark,
				ExpiresAt:     time.Now().Add(5 * time.Minute), // 5分钟后过期
			}
			if err := tx.Create(&order).Error; err != nil {
				return err
			}

			encryptString, err := util.Encrypt(merchantUser.SignKey, strconv.FormatUint(order.ID, 10))
			if err != nil {
				return err
			}

			merchantIDStr := strconv.FormatUint(merchantUser.ID, 10)
			if errSet := db.Redis.Set(c.Request.Context(), fmt.Sprintf(OrderMerchantIDCacheKeyFormat, encryptString), merchantIDStr, 5*time.Minute).Err(); errSet != nil {
				return fmt.Errorf("failed to set redis key: %w", errSet)
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
		Where("id = ? AND status = ?", orderCtx.OrderID, model.OrderStatusPending).
		First(&order).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, util.Err(OrderNotFound))
			return
		}
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}
	order.PayerUsername = orderCtx.CurrentUser.Username

	c.JSON(http.StatusOK, util.OK(GetOrderResponse{
		Order:         &order,
		UserPayConfig: orderCtx.PayConfig,
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
			if orderCtx.PayConfig.DailyLimit != nil && *orderCtx.PayConfig.DailyLimit > 0 {
				// 基于用户ID和日期生成唯一的锁ID
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
					Where("payer_username = ? AND status = ? AND type = ? AND trade_time >= ? AND trade_time < ?",
						orderCtx.CurrentUser.Username,
						model.OrderStatusSuccess,
						model.OrderTypePayment,
						todayStart,
						todayEnd).
					Select("COALESCE(SUM(amount), 0)").
					Scan(&todayTotalAmount).Error; err != nil {
					return err
				}

				// 检查当日总金额 + 当前订单金额是否超过限额
				dailyLimitDecimal := decimal.NewFromInt(*orderCtx.PayConfig.DailyLimit)
				if todayTotalAmount.Add(order.Amount).GreaterThan(dailyLimitDecimal) {
					return errors.New(DailyLimitExceeded)
				}
			}

			// 计算手续费：订单金额 * 费率，保留两位小数
			fee := order.Amount.Mul(orderCtx.PayConfig.FeeRate).Round(2)
			// 商户实际收到金额：订单金额 - 手续费
			merchantAmount := order.Amount.Sub(fee)

			feePercent := orderCtx.PayConfig.FeeRate.Mul(decimal.NewFromInt(100)).IntPart()
			feeRemark := fmt.Sprintf("[系统]: 收取商家%d%%手续费", feePercent)

			// 更新订单状态和备注
			if order.Remark != "" {
				order.Remark = order.Remark + " " + feeRemark
			} else {
				order.Remark = feeRemark
			}
			order.Status = model.OrderStatusSuccess
			order.PayerUsername = orderCtx.CurrentUser.Username
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
				})
			if result.Error != nil {
				return result.Error
			}

			// 检查是否成功扣减
			if result.RowsAffected == 0 {
				return errors.New(InsufficientBalance)
			}

			// 增加商户余额
			if err := tx.Model(&model.User{}).
				Where("id = ?", orderCtx.MerchantUser.ID).
				UpdateColumns(map[string]interface{}{
					"available_balance": gorm.Expr("available_balance + ?", merchantAmount),
					"total_receive":     gorm.Expr("total_receive + ?", merchantAmount),
				}).Error; err != nil {
				return err
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
