package payment

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/linux-do/pay/internal/apps/oauth"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/pay/internal/db"
	"github.com/linux-do/pay/internal/model"
	"github.com/linux-do/pay/internal/util"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func GetAPIKeyFromContext(c *gin.Context) (*model.MerchantAPIKey, bool) {
	apiKey, exists := c.Get(APIKeyObjKey)
	if !exists {
		return nil, false
	}
	key, ok := apiKey.(*model.MerchantAPIKey)
	return key, ok
}

func SetAPIKeyToContext(c *gin.Context, apiKey *model.MerchantAPIKey) {
	c.Set(APIKeyObjKey, apiKey)
}

// HandleParseOrderNoError 处理 ParseOrderNo 返回的错误，返回对应的 HTTP 响应
func HandleParseOrderNoError(c *gin.Context, err error) bool {
	if err == nil {
		return false
	}

	errMsg := err.Error()
	if errMsg == OrderNotFound {
		c.JSON(http.StatusNotFound, util.Err(OrderNotFound))
	} else if errMsg == MerchantInfoNotFound {
		c.JSON(http.StatusInternalServerError, util.Err(MerchantInfoNotFound))
	} else if errMsg == CannotPayOwnOrder {
		c.JSON(http.StatusBadRequest, util.Err(CannotPayOwnOrder))
	} else if errMsg == OrderNoFormatError {
		c.JSON(http.StatusBadRequest, util.Err(OrderNoFormatError))
	} else if errMsg == PayConfigNotFound {
		c.JSON(http.StatusInternalServerError, util.Err(PayConfigNotFound))
	} else if errMsg == "未登录" {
		c.JSON(http.StatusUnauthorized, util.Err("未登录"))
	} else {
		c.JSON(http.StatusInternalServerError, util.Err(errMsg))
	}
	return true
}

// OrderContext 订单上下文信息
type OrderContext struct {
	OrderID           uint64
	MerchantUser      *model.User
	CurrentUser       *model.User
	PayerPayConfig    *model.UserPayConfig
	MerchantPayConfig *model.UserPayConfig
}

// ParseOrderNo 解析订单号，获取订单上下文信息
func ParseOrderNo(c *gin.Context, orderNo string) (*OrderContext, error) {
	merchantIDStr, errGet := db.Redis.Get(c.Request.Context(), fmt.Sprintf(OrderMerchantIDCacheKeyFormat, orderNo)).Result()
	if errGet != nil {
		if errors.Is(errGet, redis.Nil) {
			return nil, errors.New(OrderNotFound)
		}
		return nil, errGet
	}

	merchantID, errParse := strconv.ParseUint(merchantIDStr, 10, 64)
	if errParse != nil {
		return nil, errors.New(OrderNoFormatError)
	}

	// 获取商户用户信息
	var merchantUser model.User
	if err := db.DB(c.Request.Context()).Where("id = ? AND is_active = ?", merchantID, true).First(&merchantUser).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New(MerchantInfoNotFound)
		}
		return nil, err
	}

	currentUser, _ := oauth.GetUserFromContext(c)

	// 验证不是商户自己支付自己的订单
	if currentUser.ID == merchantUser.ID {
		return nil, errors.New(CannotPayOwnOrder)
	}

	orderNoStr, errDecrypt := util.Decrypt(merchantUser.SignKey, orderNo)
	if errDecrypt != nil {
		return nil, errors.New(OrderNoFormatError)
	}

	orderID, errParse := strconv.ParseUint(orderNoStr, 10, 64)
	if errParse != nil {
		return nil, errors.New(OrderNoFormatError)
	}

	ctx := &OrderContext{
		OrderID:      orderID,
		MerchantUser: &merchantUser,
		CurrentUser:  currentUser,
	}

	// 获取付款用户的支付配置（用于限额检查）
	var payerPayConfig model.UserPayConfig
	if err := payerPayConfig.GetByPayScore(db.DB(c.Request.Context()), currentUser.PayScore); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New(PayConfigNotFound)
		}
		return nil, err
	}
	ctx.PayerPayConfig = &payerPayConfig

	// 获取商家的支付配置（用于手续费倍率）
	var merchantPayConfig model.UserPayConfig
	if err := merchantPayConfig.GetByPayScore(db.DB(c.Request.Context()), merchantUser.PayScore); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New(PayConfigNotFound)
		}
		return nil, err
	}
	ctx.MerchantPayConfig = &merchantPayConfig

	return ctx, nil
}
