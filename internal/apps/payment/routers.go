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
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/common"
	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/util"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// PayOrderRequest 用户支付订单请求
type PayOrderRequest struct {
	OrderNo string `json:"order_no" binding:"required"`
	PayKey  string `json:"pay_key" binding:"required,max=6"`
}

// GetOrderRequest 查询订单请求
type GetOrderRequest struct {
	OrderNo string `form:"order_no" json:"order_no" binding:"required"`
}

// MerchantInfo 商户信息
type MerchantInfo struct {
	AppName     string `json:"app_name"`
	RedirectURI string `json:"redirect_uri"`
}

// GetOrderResponse 查询订单响应
type GetOrderResponse struct {
	Order    *model.Order    `json:"order"`
	FeeRate  decimal.Decimal `json:"fee_rate"`
	Merchant MerchantInfo    `json:"merchant"`
}

// TransferRequest 转账请求
type TransferRequest struct {
	RecipientID       uint64          `json:"recipient_id,string" binding:"required"`
	RecipientUsername string          `json:"recipient_username" binding:"required"`
	Amount            decimal.Decimal `json:"amount" binding:"required"`
	PayKey            string          `json:"pay_key" binding:"required,max=6"`
	Remark            string          `json:"remark" binding:"max=100"`
}

// QueryOrderRequest 商户查询订单请求
type QueryOrderRequest struct {
	Act             string `form:"act" json:"act"`
	ClientID        string `form:"pid" json:"pid" binding:"required"`
	ClientSecret    string `form:"key" json:"key" binding:"required"`
	MerchantOrderNo string `form:"out_trade_no" json:"out_trade_no"`
	TradeNo         uint64 `form:"trade_no" json:"trade_no" binding:"required"`
}

// RefundOrderRequest 商户退款请求
type RefundOrderRequest struct {
	ClientID        string          `form:"pid" json:"pid" binding:"required"`
	ClientSecret    string          `form:"key" json:"key" binding:"required"`
	MerchantOrderNo string          `form:"out_trade_no" json:"out_trade_no"`
	TradeNo         uint64          `form:"trade_no" json:"trade_no" binding:"required"`
	Amount          decimal.Decimal `form:"money" json:"money" binding:"required"`
}

// CreateMerchantOrder 商户创建订单接口
// @Tags payment
// @Accept x-www-form-urlencoded
// @Produce json
// @Param request body CreateOrderRequest true "request body"
// @Success 200 {object} util.ResponseAny
// @Router /pay/submit.php [post]
func CreateMerchantOrder(c *gin.Context) {
	req, _ := util.GetFromContext[*CreateOrderRequest](c, CreateOrderRequestKey)
	apiKey, _ := util.GetFromContext[*model.MerchantAPIKey](c, APIKeyObjKey)

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

	var payURL string

	if err := db.DB(c.Request.Context()).Transaction(
		func(tx *gorm.DB) error {
			// 创建订单
			order := model.Order{
				OrderName:       req.OrderName,
				ClientID:        apiKey.ClientID,
				MerchantOrderNo: req.MerchantOrderNo,
				PayeeUserID:     merchantUser.ID,
				Amount:          req.Amount,
				Status:          model.OrderStatusPending,
				Type:            model.OrderTypePayment,
				Remark:          req.Remark,
				PaymentType:     req.PaymentType,
				ExpiresAt:       time.Now().Add(time.Duration(expireMinutes) * time.Minute),
			}
			if err := tx.Create(&order).Error; err != nil {
				return err
			}

			encryptString, err := util.Encrypt(merchantUser.SignKey, strconv.FormatUint(order.ID, 10))
			if err != nil {
				return err
			}

			merchantIDStr := strconv.FormatUint(merchantUser.ID, 10)
			if errSet := db.Redis.Set(c.Request.Context(), db.PrefixedKey(fmt.Sprintf(OrderMerchantIDCacheKeyFormat, encryptString)), merchantIDStr, time.Duration(expireMinutes)*time.Minute).Err(); errSet != nil {
				return fmt.Errorf("failed to set redis key: %w", errSet)
			}

			expireKey := db.PrefixedKey(fmt.Sprintf(OrderExpireKeyFormat, order.ID))
			if errSet := db.Redis.Set(c.Request.Context(), expireKey, order.ID, time.Duration(expireMinutes)*time.Minute).Err(); errSet != nil {
				return fmt.Errorf("failed to set order expire key: %w", errSet)
			}

			payURL = fmt.Sprintf("%s?order_no=%s", config.Config.App.FrontendPayURL, url.QueryEscape(encryptString))
			return nil
		},
	); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.Redirect(http.StatusFound, payURL)
}

// QueryMerchantOrderResponse 查询订单响应
type QueryMerchantOrderResponse struct {
	Code       int    `json:"code" example:"1"`
	Msg        string `json:"msg" example:"查询订单号成功！"`
	TradeNo    string `json:"trade_no" example:"123456"`
	OutTradeNo string `json:"out_trade_no" example:"M202312080001"`
	Type       string `json:"type" example:"epay"`
	Pid        string `json:"pid" example:"1001"`
	AddTime    string `json:"addtime" example:"2023-12-08 12:00:00"`
	EndTime    string `json:"endtime" example:"2023-12-08 12:05:00"`
	Name       string `json:"name" example:"商品名称"`
	Money      string `json:"money" example:"10.00"`
	Status     int    `json:"status" example:"1"`
}

// QueryMerchantOrder 商户主动查询订单状态接口
// @Tags payment
// @Accept json
// @Produce json
// @Param request query QueryOrderRequest true "查询参数"
// @Success 200 {object} QueryMerchantOrderResponse
// @Router /api.php [get]
func QueryMerchantOrder(c *gin.Context) {
	var req QueryOrderRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": -1, "msg": err.Error()})
		return
	}

	var apiKey model.MerchantAPIKey
	if err := db.DB(c.Request.Context()).Where("client_id = ? AND client_secret = ?", req.ClientID, req.ClientSecret).First(&apiKey).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": -1, "msg": MerchantInfoNotFound})
		return
	}

	var order model.Order
	if err := db.DB(c.Request.Context()).Where("id = ? AND client_id = ?", req.TradeNo, req.ClientID).First(&order).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"code": -1, "msg": OrderNotFound})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"code": -1, "msg": err.Error()})
		return
	}

	statusInt := 0
	if order.Status == model.OrderStatusSuccess {
		statusInt = 1
	}

	c.JSON(http.StatusOK, gin.H{
		"code":         1,
		"msg":          "查询订单号成功！",
		"trade_no":     strconv.FormatUint(order.ID, 10),
		"out_trade_no": order.MerchantOrderNo,
		"type":         order.PaymentType,
		"pid":          order.ClientID,
		"addtime":      order.CreatedAt.Format("2006-01-02 15:04:05"),
		"endtime":      order.TradeTime.Format("2006-01-02 15:04:05"),
		"name":         order.OrderName,
		"money":        order.Amount.Truncate(2).StringFixed(2),
		"status":       statusInt,
	})
}

// RefundMerchantOrderResponse 退款响应
type RefundMerchantOrderResponse struct {
	Code int    `json:"code" example:"1"`
	Msg  string `json:"msg" example:"退款成功"`
}

// RefundMerchantOrder 商户退款接口
// @Tags payment
// @Accept json
// @Produce json
// @Param request body RefundOrderRequest true "退款请求"
// @Success 200 {object} RefundMerchantOrderResponse
// @Router /api.php [post]
func RefundMerchantOrder(c *gin.Context) {
	var req RefundOrderRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": -1, "msg": err.Error()})
		return
	}

	if err := util.ValidateAmount(req.Amount); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": -1, "msg": err.Error()})
		return
	}

	var apiKey model.MerchantAPIKey
	if err := db.DB(c.Request.Context()).Where("client_id = ? AND client_secret = ?", req.ClientID, req.ClientSecret).First(&apiKey).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": -1, "msg": MerchantInfoNotFound})
		return
	}

	if err := db.DB(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		var order model.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ? AND client_id = ? AND status = ? AND amount = ? AND type IN ?", req.TradeNo, req.ClientID, model.OrderStatusSuccess, req.Amount, []model.OrderType{model.OrderTypePayment, model.OrderTypeOnline}).
			First(&order).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New(OrderNotFound)
			}
			return err
		}

		var payerUser model.User
		if err := payerUser.GetByID(tx, order.PayerUserID); err != nil {
			return err
		}

		var merchantUser model.User
		if err := tx.Where("id = ? AND is_active = ?", apiKey.UserID, true).First(&merchantUser).Error; err != nil {
			return err
		}

		var merchantPayConfig model.UserPayConfig
		if err := merchantPayConfig.GetByPayScore(tx, merchantUser.PayScore); err != nil {
			return err
		}

		merchantScoreDecrease := order.Amount.Mul(merchantPayConfig.ScoreRate).Round(0).IntPart()
		if err := tx.Model(&model.User{}).
			Where("id = ?", merchantUser.ID).
			UpdateColumns(map[string]interface{}{
				"available_balance": gorm.Expr("available_balance - ?", order.Amount),
				"total_receive":     gorm.Expr("total_receive - ?", order.Amount),
				"pay_score":         gorm.Expr("pay_score - ?", merchantScoreDecrease),
			}).Error; err != nil {
			return err
		}

		if err := tx.Model(&model.User{}).
			Where("id = ?", payerUser.ID).
			UpdateColumns(map[string]interface{}{
				"available_balance": gorm.Expr("available_balance + ?", order.Amount),
				"total_payment":     gorm.Expr("total_payment - ?", order.Amount),
				"pay_score":         gorm.Expr("pay_score - ?", order.Amount.Round(0).IntPart()),
			}).Error; err != nil {
			return err
		}

		if err := tx.Model(&model.Order{}).
			Where("id = ?", order.ID).
			Update("status", model.OrderStatusRefund).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": -1, "msg": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 1,
		"msg":  "退款成功",
	})
}

// MerchantDistributeRequest 商户分发请求
type MerchantDistributeRequest struct {
	RecipientID       uint64          `json:"user_id" binding:"required"`
	RecipientUsername string          `json:"username" binding:"required"`
	Amount            decimal.Decimal `json:"amount" binding:"required"`
	MerchantOrderNo   string          `json:"out_trade_no" binding:"max=64"`
	Remark            string          `json:"remark" binding:"max=100"`
}

// MerchantDistribute 商户分发接口（商户向用户分发）
// @Tags payment
// @Accept json
// @Produce json
// @Param Authorization header string true "Basic Auth (base64(client_id:client_secret))"
// @Param request body MerchantDistributeRequest true "分发请求"
// @Success 200 {object} util.ResponseAny
// @Router /pay/distribute [post]
func MerchantDistribute(c *gin.Context) {
	var req MerchantDistributeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	if err := util.ValidateAmount(req.Amount); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	apiKey, _ := util.GetFromContext[*model.MerchantAPIKey](c, APIKeyObjKey)

	var orderID uint64

	if err := db.DB(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		// 验证收款人是否存在且用户名匹配
		var recipient model.User
		if err := tx.Where("id = ? AND username = ?", req.RecipientID, req.RecipientUsername).First(&recipient).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New(RecipientNotFound)
			}
			return err
		}

		// 获取商户用户信息
		var merchantUser model.User
		if err := tx.Where("id = ? AND is_active = ?", apiKey.UserID, true).
			First(&merchantUser).Error; err != nil {
			return errors.New(MerchantInfoNotFound)
		}

		// 不能分发给自己
		if recipient.ID == merchantUser.ID {
			return errors.New(CannotTransferToSelf)
		}

		// 获取商户支付配置（用于计算分发费率和分数）
		var merchantPayConfig model.UserPayConfig
		if err := merchantPayConfig.GetByPayScore(tx, merchantUser.PayScore); err != nil {
			return errors.New(PayConfigNotFound)
		}

		_, recipientAmount, distributePercent := service.CalculateFee(req.Amount, merchantPayConfig.DistributeRate)
		merchantScore := req.Amount.Mul(merchantPayConfig.ScoreRate).Round(0).IntPart()

		order := model.Order{
			OrderName:       "商户分发",
			ClientID:        apiKey.ClientID,
			MerchantOrderNo: req.MerchantOrderNo,
			PayerUserID:     merchantUser.ID,
			PayeeUserID:     recipient.ID,
			Amount:          req.Amount,
			Status:          model.OrderStatusSuccess,
			Type:            model.OrderTypeDistribute,
			Remark:          req.Remark,
			TradeTime:       time.Now(),
			ExpiresAt:       time.Now().Add(24 * time.Hour),
		}

		distributeRemark := fmt.Sprintf("[系统]: 分发费率%d%%", distributePercent)
		if order.Remark != "" {
			order.Remark = order.Remark + " " + distributeRemark
		} else {
			order.Remark = distributeRemark
		}

		if err := tx.Create(&order).Error; err != nil {
			return err
		}
		orderID = order.ID

		// 扣减商户余额，同时增加平台分数
		if err := service.UpdateBalance(tx, service.BalanceUpdateOptions{
			UserID:       merchantUser.ID,
			Amount:       req.Amount,
			Operation:    service.BalanceDeduct,
			ScoreChange:  merchantScore,
			TotalField:   "total_payment",
			CheckBalance: true,
		}); err != nil {
			return err
		}

		// 增加收款人余额（按分发费率计算后的金额）
		if err := service.UpdateBalance(tx, service.BalanceUpdateOptions{
			UserID:       recipient.ID,
			Amount:       recipientAmount,
			Operation:    service.BalanceAdd,
			TotalField:   "total_receive",
			CheckBalance: false,
		}); err != nil {
			return err
		}

		return nil
	}); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(gin.H{
		"trade_no":     strconv.FormatUint(orderID, 10),
		"out_trade_no": req.MerchantOrderNo,
	}))
}

// GetPaymentPageDetails 查询支付订单信息接口（用于收银台页面）
// @Tags payment
// @Accept json
// @Produce json
// @Param order_no query string true "订单号"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/merchant/payment/order [get]
func GetPaymentPageDetails(c *gin.Context) {
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
			AppName:     merchant.AppName,
			RedirectURI: merchant.RedirectURI,
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

	if !orderCtx.CurrentUser.VerifyPayKey(req.PayKey) {
		c.JSON(http.StatusBadRequest, util.Err(common.PayKeyIncorrect))
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

			isTestMode := orderCtx.MerchantAPIKey.TestMode

			// 非测试模式：检查每日限额
			if !isTestMode {
				if err := service.CheckDailyLimit(tx, orderCtx.CurrentUser.ID, order.Amount, orderCtx.PayerPayConfig.DailyLimit); err != nil {
					return err
				}
			}

			// 计算手续费
			_, merchantAmount, feePercent := service.CalculateFee(order.Amount, orderCtx.MerchantPayConfig.FeeRate)

			// 更新订单状态
			order.Status = model.OrderStatusSuccess
			order.PayerUserID = orderCtx.CurrentUser.ID
			order.TradeTime = time.Now()

			if isTestMode {
				order.Type = model.OrderTypeTest
				order.Remark = common.TestModeOrderRemark
			} else {
				feeRemark := fmt.Sprintf("[系统]: 收取商家%d%%手续费", feePercent)
				if order.Remark != "" {
					order.Remark = order.Remark + " " + feeRemark
				} else {
					order.Remark = feeRemark
				}
			}

			if err := tx.Save(&order).Error; err != nil {
				return err
			}

			// 非测试模式：扣减用户余额和增加商户余额
			if !isTestMode {
				if err := service.UpdateBalance(tx, service.BalanceUpdateOptions{
					UserID:       orderCtx.CurrentUser.ID,
					Amount:       order.Amount,
					Operation:    service.BalanceDeduct,
					ScoreChange:  order.Amount.Round(0).IntPart(),
					TotalField:   "total_payment",
					CheckBalance: true,
				}); err != nil {
					return err
				}

				merchantScoreIncrease := order.Amount.Mul(orderCtx.MerchantPayConfig.ScoreRate).Round(0).IntPart()
				if err := service.UpdateBalance(tx, service.BalanceUpdateOptions{
					UserID:       orderCtx.MerchantUser.ID,
					Amount:       merchantAmount,
					Operation:    service.BalanceAdd,
					ScoreChange:  merchantScoreIncrease,
					TotalField:   "total_receive",
					CheckBalance: false,
				}); err != nil {
					return err
				}
			}

			expireKey := db.PrefixedKey(fmt.Sprintf(OrderExpireKeyFormat, order.ID))
			if err := db.Redis.Del(c.Request.Context(), expireKey).Err(); err != nil {
				log.Printf("[Payment] 删除订单过期key失败: order_id=%d, error=%v", order.ID, err)
			}

			return service.EnqueueMerchantNotify(order.ID, order.ClientID)
		},
	); err != nil {
		errMsg := err.Error()
		switch errMsg {
		case common.InsufficientBalance, OrderExpired, common.DailyLimitExceeded:
			c.JSON(http.StatusBadRequest, util.Err(errMsg))
		case OrderNotFound:
			c.JSON(http.StatusNotFound, util.Err(errMsg))
		default:
			c.JSON(http.StatusInternalServerError, util.Err(errMsg))
		}
		return
	}

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

	if err := util.ValidateAmount(req.Amount); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	currentUser, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	if !currentUser.VerifyPayKey(req.PayKey) {
		c.JSON(http.StatusBadRequest, util.Err(common.PayKeyIncorrect))
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
				return errors.New(common.InsufficientBalance)
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
