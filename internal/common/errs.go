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

package common

const (
	BannedAccount                 = "账号已被封禁"
	AmountMustBeGreaterThanZero   = "金额必须大于0"
	AmountDecimalPlacesExceeded   = "金额小数位数不能超过2位"
	RateMustBeBetweenZeroAndOne   = "比率必须在 0 到 1 之间"
	RateDecimalPlacesExceeded     = "比率小数位数不能超过2位"
	InsufficientBalance           = "余额不足"
	DailyLimitExceeded            = "已超过每日限额"
	PayKeyIncorrect               = "支付密钥错误"
	CannotPaySelf                 = "不能给自己付款"
	TestModeCannotProcessOrder    = "测试模式下无法处理订单"
	TestModeOrderRemark           = "[测试模式] 此订单为测试订单，未实际扣款"
	UnAuthorized                  = "未登录"
	RedEnvelopeDisabled           = "红包功能未启用"
	RedEnvelopeAmountExceeded     = "红包金额超过单个红包最大限额"
	RedEnvelopeDailyLimitExceeded = "今日发红包数量已达上限"
)

const (
	GetProtectionDaysFailed = "获取新用户保护期配置失败"
)
