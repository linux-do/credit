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

package util

import (
	"errors"

	"github.com/shopspring/decimal"
)

// ValidateRates 所有 rate 必须在 [0, 1] 范围内，且小数位数不超过2位
func ValidateRates(rates ...decimal.Decimal) error {
	for _, rate := range rates {
		// 验证范围：必须在 [0, 1] 之间
		if rate.LessThan(decimal.Zero) || rate.GreaterThan(decimal.NewFromInt(1)) {
			return errors.New("必须在 0 到 1 之间")
		}

		// 验证小数位数：不超过2位
		if rate.Exponent() < -2 {
			return errors.New("小数位数不能超过2位")
		}
	}

	return nil
}
