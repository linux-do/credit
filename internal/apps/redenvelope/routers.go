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
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/common"
	"github.com/linux-do/credit/internal/db"
	"github.com/linux-do/credit/internal/db/idgen"
	"github.com/linux-do/credit/internal/model"
	"github.com/linux-do/credit/internal/service"
	"github.com/linux-do/credit/internal/util"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// CreateRequest 创建红包请求
type CreateRequest struct {
	Type        model.RedEnvelopeType `json:"type" binding:"required,oneof=fixed random"`
	TotalAmount decimal.Decimal       `json:"total_amount" binding:"required"`
	TotalCount  int                   `json:"total_count" binding:"required,min=1"`
	Greeting    string                `json:"greeting" binding:"max=100"`
	PayKey      string                `json:"pay_key" binding:"required,max=10"`
}

// CreateResponse 创建红包响应
type CreateResponse struct {
	ID uint64 `json:"id,string"`
}

// ClaimRequest 领取红包请求
type ClaimRequest struct {
	ID uint64 `json:"id,string" binding:"required"`
}

// ClaimResponse 领取红包响应
type ClaimResponse struct {
	Amount      decimal.Decimal    `json:"amount"`
	RedEnvelope *model.RedEnvelope `json:"red_envelope"`
}

// DetailResponse 红包详情响应
type DetailResponse struct {
	RedEnvelope *model.RedEnvelope       `json:"red_envelope"`
	Claims      []model.RedEnvelopeClaim `json:"claims"`
	UserClaimed *model.RedEnvelopeClaim  `json:"user_claimed,omitempty"`
}

// ListRequest 红包列表请求
type ListRequest struct {
	Page     int    `json:"page" binding:"required,min=1"`
	PageSize int    `json:"page_size" binding:"required,min=1,max=100"`
	Type     string `json:"type" binding:"omitempty,oneof=sent received"`
}

// ListResponse 红包列表响应
type ListResponse struct {
	Total        int64               `json:"total"`
	Page         int                 `json:"page"`
	PageSize     int                 `json:"page_size"`
	RedEnvelopes []model.RedEnvelope `json:"red_envelopes"`
}

// Create 创建红包
// @Tags redenvelope
// @Accept json
// @Produce json
// @Param request body CreateRequest true "创建红包请求"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/redenvelope/create [post]
func Create(c *gin.Context) {
	var req CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	if err := util.ValidateAmount(req.TotalAmount); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	// 检查单个红包最大金额限制
	maxAmount, err := model.GetDecimalByKey(c.Request.Context(), model.ConfigKeyRedEnvelopeMaxAmount, 2)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}
	if req.TotalAmount.GreaterThan(maxAmount) {
		c.JSON(http.StatusBadRequest, util.Err(common.RedEnvelopeAmountExceeded))
		return
	}

	// 固定金额红包检查每个红包金额
	if req.Type == model.RedEnvelopeTypeFixed {
		perAmount := req.TotalAmount.Div(decimal.NewFromInt(int64(req.TotalCount)))
		if perAmount.LessThan(decimal.NewFromFloat(0.01)) {
			c.JSON(http.StatusBadRequest, util.Err(AmountTooSmall))
			return
		}
	}

	currentUser, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	// 检查每日红包发送数量限制
	dailyLimit, err := model.GetIntByKey(c.Request.Context(), model.ConfigKeyRedEnvelopeDailyLimit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	// 查询今日已发送的红包数量
	var todayCount int64
	today := time.Now().Truncate(24 * time.Hour)
	if err := db.DB(c.Request.Context()).Model(&model.RedEnvelope{}).
		Where("creator_id = ? AND created_at >= ?", currentUser.ID, today).
		Count(&todayCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	if todayCount >= int64(dailyLimit) {
		c.JSON(http.StatusBadRequest, util.Err(common.RedEnvelopeDailyLimitExceeded))
		return
	}

	if !currentUser.VerifyPayKey(req.PayKey) {
		c.JSON(http.StatusBadRequest, util.Err(common.PayKeyIncorrect))
		return
	}

	// 获取红包手续费率并计算手续费
	feeRate, err := model.GetDecimalByKey(c.Request.Context(), model.ConfigKeyRedEnvelopeFeeRate, 2)
	if err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	// 计算手续费（红包金额 * 费率）
	feeAmount := req.TotalAmount.Mul(feeRate).Round(2)

	// 总扣款金额 = 红包金额 + 手续费
	totalDeduction := req.TotalAmount.Add(feeAmount)

	// 提前检查余额，避免不必要的事务
	if currentUser.AvailableBalance.LessThan(totalDeduction) {
		c.JSON(http.StatusBadRequest, util.Err(common.InsufficientBalance))
		return
	}

	var redEnvelope model.RedEnvelope

	if err := db.DB(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		// 扣减发送者余额并更新total_payment
		if err := service.UpdateBalance(tx, service.BalanceUpdateOptions{
			UserID:       currentUser.ID,
			Amount:       totalDeduction,
			Operation:    service.BalanceDeduct,
			TotalField:   "total_payment",
			CheckBalance: true,
		}); err != nil {
			return err
		}

		// 创建红包
		redEnvelope = model.RedEnvelope{
			ID:              idgen.NextUint64ID(),
			CreatorID:       currentUser.ID,
			Type:            req.Type,
			TotalAmount:     req.TotalAmount,
			RemainingAmount: req.TotalAmount,
			TotalCount:      req.TotalCount,
			RemainingCount:  req.TotalCount,
			Greeting:        req.Greeting,
			Status:          model.RedEnvelopeStatusActive,
			ExpiresAt:       time.Now().Add(24 * time.Hour),
		}

		if err := tx.Create(&redEnvelope).Error; err != nil {
			return err
		}

		// 创建订单记录（红包支出）
		remarkMsg := fmt.Sprintf("创建红包，共%d个", req.TotalCount)
		if feeAmount.GreaterThan(decimal.Zero) {
			remarkMsg = fmt.Sprintf("%s，手续费: %s", remarkMsg, feeAmount.String())
		}
		if req.Greeting != "" {
			remarkMsg = fmt.Sprintf("%s，祝福语: %s", remarkMsg, req.Greeting)
		}

		order := model.Order{
			OrderName:   "红包支出",
			PayerUserID: currentUser.ID,
			Amount:      totalDeduction,
			Status:      model.OrderStatusSuccess,
			Type:        model.OrderTypeRedEnvelopeSend,
			Remark:      remarkMsg,
			TradeTime:   time.Now(),
			ExpiresAt:   time.Now().Add(24 * time.Hour),
		}

		return tx.Create(&order).Error
	}); err != nil {
		if err.Error() == common.InsufficientBalance {
			c.JSON(http.StatusBadRequest, util.Err(common.InsufficientBalance))
		} else {
			c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		}
		return
	}

	c.JSON(http.StatusOK, util.OK(CreateResponse{
		ID: redEnvelope.ID,
	}))
}

// Claim 领取红包
// @Tags redenvelope
// @Accept json
// @Produce json
// @Param request body ClaimRequest true "领取红包请求"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/redenvelope/claim [post]
func Claim(c *gin.Context) {
	var req ClaimRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	currentUser, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	var claimedAmount decimal.Decimal
	var redEnvelope model.RedEnvelope

	if err := db.DB(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		// 使用 FOR UPDATE 锁定红包记录，防止并发领取
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "NOWAIT"}).
			Where("id = ?", req.ID).First(&redEnvelope).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New(RedEnvelopeNotFound)
			}
			// 捕获锁等待超时错误，返回友好提示
			return errors.New(RedEnvelopeTooPopular)
		}

		// 检查红包状态
		if redEnvelope.Status == model.RedEnvelopeStatusExpired || redEnvelope.ExpiresAt.Before(time.Now()) {
			return errors.New(RedEnvelopeExpired)
		}

		if redEnvelope.Status == model.RedEnvelopeStatusFinished || redEnvelope.RemainingCount <= 0 {
			return errors.New(RedEnvelopeFinished)
		}

		// 检查是否已领取
		var existingClaim model.RedEnvelopeClaim
		if err := tx.Where("red_envelope_id = ? AND user_id = ?", redEnvelope.ID, currentUser.ID).
			First(&existingClaim).Error; err == nil {
			return errors.New(RedEnvelopeAlreadyClaimed)
		}

		// 计算领取金额
		if redEnvelope.Type == model.RedEnvelopeTypeFixed {
			// 固定金额：如果是最后一个，给全部剩余金额（避免舍入误差）
			if redEnvelope.RemainingCount == 1 {
				claimedAmount = redEnvelope.RemainingAmount
			} else {
				claimedAmount = redEnvelope.TotalAmount.Div(decimal.NewFromInt(int64(redEnvelope.TotalCount))).Round(2)
			}
		} else {
			// 拼手气红包：使用二倍均值算法
			claimedAmount = calculateRandomAmount(redEnvelope.RemainingAmount, redEnvelope.RemainingCount)
		}

		// 创建领取记录
		claim := model.RedEnvelopeClaim{
			ID:            idgen.NextUint64ID(),
			RedEnvelopeID: redEnvelope.ID,
			UserID:        currentUser.ID,
			Amount:        claimedAmount,
		}
		if err := tx.Create(&claim).Error; err != nil {
			return err
		}

		// 更新红包状态
		newRemainingCount := redEnvelope.RemainingCount - 1
		newRemainingAmount := redEnvelope.RemainingAmount.Sub(claimedAmount)
		newStatus := redEnvelope.Status
		if newRemainingCount <= 0 {
			newStatus = model.RedEnvelopeStatusFinished
		}

		if err := tx.Model(&model.RedEnvelope{}).Where("id = ?", redEnvelope.ID).
			Updates(map[string]interface{}{
				"remaining_count":  newRemainingCount,
				"remaining_amount": newRemainingAmount,
				"status":           newStatus,
			}).Error; err != nil {
			return err
		}

		// 更新红包对象用于返回
		redEnvelope.RemainingCount = newRemainingCount
		redEnvelope.RemainingAmount = newRemainingAmount
		redEnvelope.Status = newStatus

		// 增加领取者余额并更新total_receive
		if err := service.UpdateBalance(tx, service.BalanceUpdateOptions{
			UserID:     currentUser.ID,
			Amount:     claimedAmount,
			Operation:  service.BalanceAdd,
			TotalField: "total_receive",
		}); err != nil {
			return err
		}

		// 创建订单记录（红包收入）
		order := model.Order{
			OrderName:   "红包收入",
			PayerUserID: redEnvelope.CreatorID,
			PayeeUserID: currentUser.ID,
			Amount:      claimedAmount,
			Status:      model.OrderStatusSuccess,
			Type:        model.OrderTypeRedEnvelopeReceive,
			Remark:      fmt.Sprintf("祝福语: %s", redEnvelope.Greeting),
			TradeTime:   time.Now(),
			ExpiresAt:   time.Now().Add(24 * time.Hour),
		}

		return tx.Create(&order).Error
	}); err != nil {
		errMsg := err.Error()
		switch errMsg {
		case RedEnvelopeNotFound:
			c.JSON(http.StatusNotFound, util.Err(errMsg))
		case RedEnvelopeExpired, RedEnvelopeFinished, RedEnvelopeAlreadyClaimed, CannotClaimOwnRedEnvelope:
			c.JSON(http.StatusBadRequest, util.Err(errMsg))
		default:
			c.JSON(http.StatusInternalServerError, util.Err(errMsg))
		}
		return
	}

	c.JSON(http.StatusOK, util.OK(ClaimResponse{
		Amount:      claimedAmount,
		RedEnvelope: &redEnvelope,
	}))
}

// GetDetail 获取红包详情
// @Tags redenvelope
// @Produce json
// @Param id path string true "红包ID"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/redenvelope/{id} [get]
func GetDetail(c *gin.Context) {
	idStr := c.Param("id")
	redEnvelopeID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, util.Err(InvalidRedEnvelopeID))
		return
	}

	currentUser, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	var redEnvelope model.RedEnvelope
	if err := db.DB(c.Request.Context()).
		Select("red_envelopes.*, users.username as creator_username, users.avatar_url as creator_avatar_url").
		Joins("LEFT JOIN users ON red_envelopes.creator_id = users.id").
		Where("red_envelopes.id = ?", redEnvelopeID).First(&redEnvelope).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, util.Err(RedEnvelopeNotFound))
			return
		}
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	var claims []model.RedEnvelopeClaim
	db.DB(c.Request.Context()).
		Select("red_envelope_claims.*, users.username, users.avatar_url").
		Joins("LEFT JOIN users ON red_envelope_claims.user_id = users.id").
		Where("red_envelope_claims.red_envelope_id = ?", redEnvelope.ID).
		Order("red_envelope_claims.claimed_at DESC").
		Find(&claims)

	var userClaimed *model.RedEnvelopeClaim
	if currentUser != nil {
		for i := range claims {
			if claims[i].UserID == currentUser.ID {
				userClaimed = &claims[i]
				break
			}
		}
	}

	c.JSON(http.StatusOK, util.OK(DetailResponse{
		RedEnvelope: &redEnvelope,
		Claims:      claims,
		UserClaimed: userClaimed,
	}))
}

// List 获取红包列表
// @Tags redenvelope
// @Accept json
// @Produce json
// @Param request body ListRequest true "列表请求"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/redenvelope/list [post]
func List(c *gin.Context) {
	var req ListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	currentUser, _ := util.GetFromContext[*model.User](c, oauth.UserObjKey)

	query := db.DB(c.Request.Context()).Model(&model.RedEnvelope{}).
		Select("red_envelopes.*, users.username as creator_username, users.avatar_url as creator_avatar_url").
		Joins("LEFT JOIN users ON red_envelopes.creator_id = users.id")

	if req.Type == "sent" {
		query = query.Where("red_envelopes.creator_id = ?", currentUser.ID)
	} else if req.Type == "received" {
		query = query.Joins("INNER JOIN red_envelope_claims ON red_envelopes.id = red_envelope_claims.red_envelope_id").
			Where("red_envelope_claims.user_id = ?", currentUser.ID)
	} else {
		query = query.Where("red_envelopes.creator_id = ?", currentUser.ID)
	}

	var total int64
	query.Count(&total)

	var redEnvelopes []model.RedEnvelope
	query.Order("red_envelopes.created_at DESC").
		Offset((req.Page - 1) * req.PageSize).
		Limit(req.PageSize).
		Find(&redEnvelopes)

	c.JSON(http.StatusOK, util.OK(ListResponse{
		Total:        total,
		Page:         req.Page,
		PageSize:     req.PageSize,
		RedEnvelopes: redEnvelopes,
	}))
}
