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

import (
	"math/rand"

	"github.com/shopspring/decimal"
)

// calculateRandomAmount 二倍均值算法计算随机红包金额
func calculateRandomAmount(remaining decimal.Decimal, count int) decimal.Decimal {
	// 如果是最后一个红包，返回所有剩余金额（避免舍入误差）
	if count == 1 {
		return remaining
	}

	minAmount := decimal.NewFromFloat(0.01)
	
	// 确保剩余金额足够分配给所有人至少0.01
	minRequired := minAmount.Mul(decimal.NewFromInt(int64(count)))
	if remaining.LessThan(minRequired) {
		// 如果剩余金额不足，平均分配
		return remaining.Div(decimal.NewFromInt(int64(count))).Round(2)
	}

	// 二倍均值算法：金额范围 [0.01, min(剩余金额/剩余人数*2, 剩余金额-其他人最小金额)]
	avg := remaining.Div(decimal.NewFromInt(int64(count)))
	maxAmount := avg.Mul(decimal.NewFromInt(2))
	
	// 确保给其他人留下足够的金额（每人至少0.01）
	maxPossible := remaining.Sub(minAmount.Mul(decimal.NewFromInt(int64(count - 1))))
	if maxAmount.GreaterThan(maxPossible) {
		maxAmount = maxPossible
	}
	
	// 确保maxAmount不小于minAmount
	if maxAmount.LessThan(minAmount) {
		maxAmount = minAmount
	}

	// 生成随机金额 [minAmount, maxAmount]
	diff := maxAmount.Sub(minAmount)
	if diff.LessThanOrEqual(decimal.Zero) {
		return minAmount
	}

	// 生成随机数：转换为分（cents）来处理，避免精度问题
	diffCents := diff.Mul(decimal.NewFromInt(100)).IntPart()
	if diffCents <= 0 {
		return minAmount
	}
	
	randCents := rand.Int63n(diffCents + 1) // [0, diffCents]
	randAmount := decimal.NewFromInt(randCents).Div(decimal.NewFromInt(100))
	amount := minAmount.Add(randAmount)

	return amount.Round(2)
}