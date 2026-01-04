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

package redenvelope

const (
	RedEnvelopeNotFound       = "红包不存在"
	RedEnvelopeExpired        = "红包已过期"
	RedEnvelopeFinished       = "红包已领完"
	RedEnvelopeAlreadyClaimed = "您已领取过该红包"
	CannotClaimOwnRedEnvelope = "不能领取自己的红包"
	InvalidRedEnvelopeType    = "无效的红包类型"
	InvalidRedEnvelopeCount   = "红包个数必须大于0"
	InvalidRedEnvelopeAmount  = "红包金额必须大于0"
	AmountTooSmall            = "每个红包金额不能小于0.01"
	RedEnvelopeTooPopular     = "太火爆啦，稍后再试试吧~"
	InvalidRedEnvelopeID      = "红包ID格式错误"
)
