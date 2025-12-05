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
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/hibiken/asynq"
	"github.com/linux-do/pay/internal/db"
	"github.com/linux-do/pay/internal/logger"
	"github.com/linux-do/pay/internal/model"
	"github.com/linux-do/pay/internal/util"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// HandleMerchantPaymentNotify 处理商户支付回调任务
func HandleMerchantPaymentNotify(ctx context.Context, t *asynq.Task) error {
	// 解析任务参数
	var payload struct {
		OrderID  uint64 `json:"order_id"`
		ClientID string `json:"client_id"`
	}
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		logger.ErrorF(ctx, "解析商户回调任务参数失败: %v", err)
		return fmt.Errorf("解析任务参数失败: %w", err)
	}

	// 查询订单信息
	var order model.Order
	if err := db.DB(ctx).Where("id = ? AND status = ?", payload.OrderID, model.OrderStatusSuccess).First(&order).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			logger.ErrorF(ctx, "订单[ID:%d]不存在，跳过回调", payload.OrderID)
			return nil
		}
		return fmt.Errorf("查询订单失败: %w", err)
	}

	// 查询商户API Key信息
	var apiKey model.MerchantAPIKey
	if err := db.DB(ctx).Where("client_id = ?", payload.ClientID).First(&apiKey).Error; err != nil {
		logger.ErrorF(ctx, "查询商户[ClientID:%s]失败: %v", payload.ClientID, err)
		return fmt.Errorf("查询商户信息失败: %w", err)
	}

	// 构建回调参数
	callbackParams := map[string]string{
		"pid":          payload.ClientID,
		"trade_no":     strconv.FormatUint(order.ID, 10),
		"out_trade_no": order.MerchantOrderNo,
		"type":         util.PayTypeEPay,
		"name":         order.OrderName,
		"money":        order.Amount.Truncate(2).StringFixed(2),
		"trade_status": "TRADE_SUCCESS",
		"sign_type":    "MD5",
	}

	// 生成签名
	callbackParams["sign"] = GenerateSignature(callbackParams, apiKey.ClientSecret)

	// 执行HTTP回调
	if err := sendCallbackRequest(ctx, apiKey.RedirectURI, callbackParams); err != nil {
		// 获取当前重试次数
		retried, _ := asynq.GetRetryCount(ctx)
		maxRetry := 5

		logger.ErrorF(ctx, "商户回调失败: 订单[ID:%d] 重试次数[%d/%d] 错误: %v",
			payload.OrderID, retried, maxRetry, err)

		// 如果已经重试了5次（retried从0开始，4表示第5次重试），执行退款
		if retried >= maxRetry-1 {
			logger.ErrorF(ctx, "商户回调达到最大重试次数，开始执行退款: 订单[ID:%d]", payload.OrderID)
			if refundErr := executeRefundForOrder(ctx, payload.OrderID); refundErr != nil {
				logger.ErrorF(ctx, "订单[ID:%d]自动退款失败: %v", payload.OrderID, refundErr)
				// 退款失败也返回错误，让任务进入dead队列等待人工处理
				return fmt.Errorf("回调失败且自动退款失败: %w", refundErr)
			}
			logger.InfoF(ctx, "订单[ID:%d]自动退款成功", payload.OrderID)
			return nil // 退款成功，任务完成
		}

		// 还未达到最大重试次数，返回错误让asynq继续重试
		return fmt.Errorf("商户回调失败: %w", err)
	}

	logger.InfoF(ctx, "商户回调成功: 订单[ID:%d] ClientID[%s]", payload.OrderID, payload.ClientID)
	return nil
}

// sendCallbackRequest 发送HTTP回调请求
func sendCallbackRequest(ctx context.Context, callbackURL string, params map[string]string) error {
	vals := url.Values{}
	for k, v := range params {
		vals.Add(k, v)
	}

	// 拼接URL
	separator := "?"
	if strings.Contains(callbackURL, "?") {
		separator = "&"
	}
	targetURL := callbackURL + separator + vals.Encode()

	headers := map[string]string{
		"User-Agent": "LinuxDo-Pay/1.0",
	}

	resp, err := util.Request(ctx, http.MethodGet, targetURL, nil, headers, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("回调返回异常状态码: %d", resp.StatusCode)
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("读取响应失败: %w", err)
	}

	responseText := strings.TrimSpace(strings.ToLower(string(respBody)))
	if responseText != "success" {
		return fmt.Errorf("回调返回非成功响应: %s", string(respBody))
	}

	logger.InfoF(ctx, "商户回调请求成功: URL[%s] 响应[%s]", callbackURL, string(respBody))
	return nil
}

// executeRefundForOrder 执行订单退款
func executeRefundForOrder(ctx context.Context, orderID uint64) error {
	return db.DB(ctx).Transaction(func(tx *gorm.DB) error {
		// 锁定订单
		var order model.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "NOWAIT"}).
			Where("id = ? AND status = ?", orderID, model.OrderStatusSuccess).
			First(&order).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				logger.InfoF(ctx, "订单[ID:%d]已被处理或状态异常，跳过退款", orderID)
				return nil // 订单已处理，不算错误
			}
			return fmt.Errorf("锁定订单失败: %w", err)
		}

		// 只退款支付类型的订单
		if order.Type != model.OrderTypePayment {
			logger.InfoF(ctx, "订单[ID:%d]类型为%s，不支持退款", orderID, order.Type)
			return nil
		}

		// 查询付款方和收款方用户
		var payerUser, payeeUser model.User
		if err := tx.Where("id = ?", order.PayerUserID).First(&payerUser).Error; err != nil {
			return fmt.Errorf("查询付款方用户失败: %w", err)
		}
		if err := tx.Where("id = ?", order.PayeeUserID).First(&payeeUser).Error; err != nil {
			return fmt.Errorf("查询收款方用户失败: %w", err)
		}

		// 获取商家的支付配置（用于计算积分扣减）
		var merchantPayConfig model.UserPayConfig
		if err := merchantPayConfig.GetByPayScore(tx, payeeUser.PayScore); err != nil {
			return fmt.Errorf("查询商家支付配置失败: %w", err)
		}

		// 计算商家积分减少：订单金额 × 商家的 score_rate
		merchantScoreDecrease := order.Amount.Mul(merchantPayConfig.ScoreRate).Round(0).IntPart()

		// 商家(收款方)退款：扣除可用余额、总收款和积分
		if err := tx.Model(&model.User{}).
			Where("id = ?", payeeUser.ID).
			UpdateColumns(map[string]interface{}{
				"available_balance": gorm.Expr("available_balance - ?", order.Amount),
				"total_receive":     gorm.Expr("total_receive - ?", order.Amount),
				"pay_score":         gorm.Expr("pay_score - ?", merchantScoreDecrease),
			}).Error; err != nil {
			return fmt.Errorf("商家退款失败: %w", err)
		}

		// 付款方收到退款：增加可用余额，减少总支付和支付积分
		if err := tx.Model(&model.User{}).
			Where("id = ?", payerUser.ID).
			UpdateColumns(map[string]interface{}{
				"available_balance": gorm.Expr("available_balance + ?", order.Amount),
				"total_payment":     gorm.Expr("total_payment - ?", order.Amount),
				"pay_score":         gorm.Expr("pay_score - ?", order.Amount.Round(0).IntPart()),
			}).Error; err != nil {
			return fmt.Errorf("付款方退款失败: %w", err)
		}

		// 更新订单状态为已退款
		if err := tx.Model(&model.Order{}).
			Where("id = ?", order.ID).
			UpdateColumn("status", model.OrderStatusRefund).Error; err != nil {
			return fmt.Errorf("更新订单状态失败: %w", err)
		}

		logger.InfoF(ctx, "回调失败自动退款成功: 订单[ID:%d] 金额[%s] 付款方[%s] 商家[%s]",
			order.ID, order.Amount.String(), payerUser.Username, payeeUser.Username)

		return nil
	})
}
