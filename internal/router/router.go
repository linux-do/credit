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

package router

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/linux-do/pay/internal/apps/admin"
	publicconfig "github.com/linux-do/pay/internal/apps/config"
	"github.com/linux-do/pay/internal/apps/dispute"
	"github.com/linux-do/pay/internal/apps/merchant/api_key"
	"github.com/linux-do/pay/internal/apps/merchant/link"
	"github.com/linux-do/pay/internal/listener"

	"github.com/linux-do/pay/internal/apps/payment"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/redis"
	"github.com/gin-gonic/gin"
	_ "github.com/linux-do/pay/docs"
	"github.com/linux-do/pay/internal/apps/admin/system_config"
	"github.com/linux-do/pay/internal/apps/admin/user_pay_config"
	"github.com/linux-do/pay/internal/apps/health"
	"github.com/linux-do/pay/internal/apps/oauth"
	"github.com/linux-do/pay/internal/apps/order"
	"github.com/linux-do/pay/internal/apps/user"
	"github.com/linux-do/pay/internal/config"
	"github.com/linux-do/pay/internal/otel_trace"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
)

func Serve() {
	// 运行模式
	if config.Config.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 初始化路由
	r := gin.New()
	r.Use(gin.Recovery())

	// Session
	sessionStore, err := redis.NewStoreWithDB(
		config.Config.Redis.MinIdleConn,
		"tcp",
		fmt.Sprintf("%s:%d", config.Config.Redis.Host, config.Config.Redis.Port),
		config.Config.Redis.Username,
		config.Config.Redis.Password,
		strconv.Itoa(config.Config.Redis.DB),
		[]byte(config.Config.App.SessionSecret),
	)
	if err != nil {
		log.Fatalf("[API] init session store failed: %v\n", err)
	}
	sessionStore.Options(
		sessions.Options{
			Path:     "/",
			Domain:   config.Config.App.SessionDomain,
			MaxAge:   config.Config.App.SessionAge,
			HttpOnly: config.Config.App.SessionHttpOnly,
			Secure:   config.Config.App.SessionSecure, // 若用 HTTPS 可以设 true
		},
	)
	r.Use(sessions.Sessions(config.Config.App.SessionCookieName, sessionStore))

	// 补充中间件
	r.Use(otelgin.Middleware(config.Config.App.AppName), loggerMiddleware())

	// 支付接口
	r.POST("/pay/submit.php", payment.RequireSignatureAuth(), payment.CreateMerchantOrder)
	// 查询订单
	r.GET("/api.php", payment.QueryMerchantOrder)
	// 退款接口
	r.POST("/api.php", payment.RefundMerchantOrder)

	apiGroup := r.Group(config.Config.App.APIPrefix)
	{
		if config.Config.App.Env == "development" {
			// Swagger
			apiGroup.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
		}

		// API V1
		apiV1Router := apiGroup.Group("/v1")
		{
			// Health
			apiV1Router.GET("/health", health.Health)

			// OAuth
			apiV1Router.GET("/oauth/login", oauth.GetLoginURL)
			apiV1Router.GET("/oauth/logout", oauth.LoginRequired(), oauth.Logout)
			apiV1Router.POST("/oauth/callback", oauth.Callback)
			apiV1Router.GET("/oauth/user-info", oauth.LoginRequired(), oauth.UserInfo)

			// User
			userRouter := apiV1Router.Group("/user")
			userRouter.Use(oauth.LoginRequired())
			{
				userRouter.PUT("/pay-key", user.UpdatePayKey)
			}

			// Order
			orderRouter := apiV1Router.Group("/order")
			orderRouter.Use(oauth.LoginRequired())
			{
				orderRouter.POST("/transactions", order.ListTransactions)
				orderRouter.POST("/dispute", dispute.CreateDispute)
				orderRouter.POST("/disputes/merchant", dispute.ListMerchantDisputes)
				orderRouter.POST("/disputes", dispute.ListDisputes)
				orderRouter.POST("/refund-review", dispute.RefundReview)
				orderRouter.POST("/dispute/close", dispute.CloseDispute)
			}

			// Payment
			paymentRouter := apiV1Router.Group("/payment")
			paymentRouter.Use(oauth.LoginRequired())
			{
				paymentRouter.POST("/transfer", payment.Transfer)
			}

			// Config (public)
			configRouter := apiV1Router.Group("/config")
			{
				configRouter.GET("/public", publicconfig.GetPublicConfig)
			}

			// MerchantAPIKey
			merchantRouter := apiV1Router.Group("/merchant")
			{
				merchantRouter.POST("/api-keys", oauth.LoginRequired(), api_key.CreateAPIKey)
				merchantRouter.GET("/api-keys", oauth.LoginRequired(), api_key.ListAPIKeys)

				apiKeyRouter := merchantRouter.Group("/api-keys/:id")
				apiKeyRouter.Use(oauth.LoginRequired(), api_key.RequireAPIKey())
				{
					apiKeyRouter.GET("", api_key.GetAPIKey)
					apiKeyRouter.PUT("", api_key.UpdateAPIKey)
					apiKeyRouter.DELETE("", api_key.DeleteAPIKey)

					// Payment Links
					linkRouter := apiKeyRouter.Group("/payment-links")
					{
						linkRouter.GET("", link.ListPaymentLinks)
						linkRouter.POST("", link.CreatePaymentLink)
						linkRouter.DELETE("/:linkId", link.DeletePaymentLink)
					}
				}

				merchantRouter.GET("/payment-links/:token", oauth.LoginRequired(), link.GetPaymentLinkByToken)
				merchantRouter.POST("/payment-links/pay", oauth.LoginRequired(), link.PayByLink)

				// MerchantAPIKey Payment
				MerchantPaymentRouter := merchantRouter.Group("/payment")
				{
					MerchantPaymentRouter.GET("/order", oauth.LoginRequired(), payment.GetPaymentPageDetails)
					MerchantPaymentRouter.POST("", oauth.LoginRequired(), payment.PayMerchantOrder)
				}
			}

			// Admin
			adminRouter := apiV1Router.Group("/admin")
			adminRouter.Use(oauth.LoginRequired(), admin.LoginAdminRequired())
			{
				// System Config
				adminRouter.POST("/system-configs", system_config.CreateSystemConfig)
				adminRouter.GET("/system-configs", system_config.ListSystemConfigs)

				systemConfigRouter := adminRouter.Group("/system-configs/:key")
				{
					systemConfigRouter.GET("", system_config.GetSystemConfig)
					systemConfigRouter.PUT("", system_config.UpdateSystemConfig)
					systemConfigRouter.DELETE("", system_config.DeleteSystemConfig)
				}

				// User Pay Config
				adminRouter.POST("/user-pay-configs", user_pay_config.CreateUserPayConfig)
				adminRouter.GET("/user-pay-configs", user_pay_config.ListUserPayConfigs)

				userPayConfigRouter := adminRouter.Group("/user-pay-configs/:id")
				{
					userPayConfigRouter.GET("", user_pay_config.GetUserPayConfig)
					userPayConfigRouter.PUT("", user_pay_config.UpdateUserPayConfig)
					userPayConfigRouter.DELETE("", user_pay_config.DeleteUserPayConfig)
				}
			}
		}
	}

	expireListenerCtx, expireListenerCancel := context.WithCancel(context.Background())

	if err := listener.StartExpireListener(expireListenerCtx); err != nil {
		log.Fatalf("[API] 警告: 启动过期监听器失败: %v\n", err)
	}

	srv := &http.Server{
		Addr:    config.Config.App.Addr,
		Handler: r,
	}

	go func() {
		log.Printf("[API] server starting on %s\n", config.Config.App.Addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("[API] server failed: %v\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	shutdownCtx, cancel := context.WithTimeout(context.Background(), time.Duration(config.Config.App.GracefulShutdownTimeout)*time.Second)
	defer cancel()
	defer expireListenerCancel()

	otel_trace.Shutdown(shutdownCtx)

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("[API] server forced to shutdown: %v\n", err)
	}

	log.Println("[API] server exited")
}
