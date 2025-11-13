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

const (
	OrderNotFound               = "订单不存在或已完成"
	OrderStatusInvalid          = "订单状态不允许支付"
	OrderExpired                = "订单已过期"
	InsufficientBalance         = "余额不足"
	MerchantInfoNotFound        = "商户信息不存在"
	OrderNoFormatError          = "订单号格式错误"
	AmountMustBeGreaterThanZero = "金额必须大于0"
	AmountDecimalPlacesExceeded = "金额小数位数不能超过2位"
	CannotPayOwnOrder           = "不能支付自己的订单"
	DailyLimitExceeded          = "超过当日支付限额"
	PayConfigNotFound           = "支付配置不存在"
	PayKeyIncorrect             = "支付密码错误"
)
