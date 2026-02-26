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

const (
	OrderNotFound          = "订单不存在或已完成"
	OrderStatusInvalid     = "订单状态不允许支付"
	OrderExpired           = "订单已过期"
	MerchantInfoNotFound   = "商户信息不存在"
	RecipientNotFound      = "收款人不存在"
	OrderNoFormatError     = "订单号格式错误"
	CannotTransferToSelf   = "不能转账给自己"
	PayConfigNotFound      = "支付配置不存在"
	InvalidPublicKeyFormat = "公钥格式错误"
	InvalidPublicKeyLength = "公钥长度必须为32字节"
)
