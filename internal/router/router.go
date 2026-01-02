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

package router

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/linux-do/credit/internal/apps/admin"
	admin_task "github.com/linux-do/credit/internal/apps/admin/task"
	admin_user "github.com/linux-do/credit/internal/apps/admin/user"
	publicconfig "github.com/linux-do/credit/internal/apps/config"
	"github.com/linux-do/credit/internal/apps/dispute"
	"github.com/linux-do/credit/internal/apps/health"
	"github.com/linux-do/credit/internal/apps/merchant/api_key"
	"github.com/linux-do/credit/internal/apps/merchant/link"
	"github.com/linux-do/credit/internal/apps/redenvelope"
	"github.com/linux-do/credit/internal/listener"
	"github.com/linux-do/credit/internal/util"

	"github.com/linux-do/credit/internal/apps/payment"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/redis"
	"github.com/gin-gonic/gin"
	_ "github.com/linux-do/credit/docs"
	"github.com/linux-do/credit/internal/apps/admin/system_config"
	"github.com/linux-do/credit/internal/apps/admin/user_pay_config"
	"github.com/linux-do/credit/internal/apps/dashboard"
	"github.com/linux-do/credit/internal/apps/oauth"
	"github.com/linux-do/credit/internal/apps/order"
	"github.com/linux-do/credit/internal/apps/user"
	"github.com/linux-do/credit/internal/config"
	"github.com/linux-do/credit/internal/otel_trace"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
)

func Serve() {
	// 运行模式
	if config.Config.App.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	// 初始化路由
	r := gin.New()
	r.Use(gin.Recovery())

	cfg := config.Config.Redis
	addrs := cfg.Addrs
	sessionAddr := "localhost:6379"
	if len(addrs) > 0 {
		sessionAddr = addrs[0]
	}

	sessionStore, err := redis.NewStoreWithDB(
		cfg.MinIdleConn,
		"tcp",
		sessionAddr,
		cfg.Username,
		cfg.Password,
		strconv.Itoa(cfg.DB),
		[]byte(config.Config.App.SessionSecret),
	)
	if err != nil {
		log.Fatalf("[API] init session store failed: %v\n", err)
	}

	// 设置 Session Redis Key 前缀
	if cfg.KeyPrefix != "" {
		if err := redis.SetKeyPrefix(sessionStore, cfg.KeyPrefix+"session:"); err != nil {
			log.Printf("[API] set session key prefix failed: %v\n", err)
		}
	}

	sessionStore.Options(util.GetSessionOptions(config.Config.App.SessionAge))

	r.Use(sessions.Sessions(config.Config.App.SessionCookieName, sessionStore))

	// 补充中间件
	r.Use(otelgin.Middleware(config.Config.App.AppName), loggerMiddleware())

	// 支付接口
	r.POST("/pay/submit.php", payment.RequireSignatureAuth(), payment.CreateMerchantOrder)
	// 查询订单
	r.GET("/api.php", payment.QueryMerchantOrder)
	// 退款接口
	r.POST("/api.php", payment.RefundMerchantOrder)
	// 商户分发接口
	r.POST("/pay/distribute", payment.RequireMerchantAuth(), payment.MerchantDistribute)

	apiGroup := r.Group(config.Config.App.APIPrefix)
	{
		if !config.Config.App.IsProduction() {
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

			// Dashboard
			dashboardRouter := apiV1Router.Group("/dashboard")
			dashboardRouter.Use(oauth.LoginRequired())
			{
				dashboardRouter.GET("/stats/daily", dashboard.GetDailyStats)
				dashboardRouter.GET("/stats/top-customers", dashboard.GetTopCustomers)
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

			// Red Envelope
			redEnvelopeRouter := apiV1Router.Group("/redenvelope")
			{
				redEnvelopeRouter.GET("/:id", oauth.LoginRequired(), redenvelope.CheckRedEnvelopeEnabled(), redenvelope.GetDetail)
				redEnvelopeRouter.POST("/create", oauth.LoginRequired(), redenvelope.CheckRedEnvelopeEnabled(), redenvelope.Create)
				redEnvelopeRouter.POST("/claim", oauth.LoginRequired(), redenvelope.CheckRedEnvelopeEnabled(), redenvelope.Claim)
				redEnvelopeRouter.POST("/list", oauth.LoginRequired(), redenvelope.CheckRedEnvelopeEnabled(), redenvelope.List)
			}

			// Config (public)
			configRouter := apiV1Router.Group("/config")
			{
				configRouter.GET("/public", publicconfig.GetPublicConfig)
				configRouter.GET("/user-pay", user_pay_config.ListUserPayConfigs)
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
						linkRouter.PUT("/:linkId", link.UpdatePaymentLink)
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
				// Task dispatch
				adminRouter.GET("/tasks/types", admin_task.ListTaskTypes)
				adminRouter.POST("/tasks/dispatch", admin_task.DispatchTask)

				// Users
				adminRouter.GET("/users", admin_user.ListUsers)
				adminRouter.PUT("/users/:id/status", admin_user.UpdateUserStatus)

				// System Config
				adminRouter.POST("/system-configs", system_config.CreateSystemConfig)
				adminRouter.GET("/system-configs", system_config.ListSystemConfigs)

				systemConfigRouter := adminRouter.Group("/system-configs/:key")
				{
					systemConfigRouter.GET("", system_config.GetSystemConfig)
					systemConfigRouter.PUT("", system_config.UpdateSystemConfig)
					systemConfigRouter.DELETE("", system_config.DeleteSystemConfig)
				}

				// User Credit Config
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
