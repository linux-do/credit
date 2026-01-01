"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { motion } from "motion/react"
import { PayingNow } from "@/components/common/pay/paying/paying-now"
import { PayingInfo } from "@/components/common/pay/paying/paying-info"
import { useUser } from "@/contexts/user-context"

import services from "@/lib/services"
import { ConfigService } from "@/lib/services"
import type { PaymentLink, GetMerchantOrderResponse, UserPayConfig } from "@/lib/services"


/**
 * 支付链接支付页面组件
 * 通过 token 查询支付链接信息并完成支付
 */
export function PayingOnline() {
  /* 获取URL参数中的Token */
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { user } = useUser()

  /* 组件状态管理 */
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null)
  const [orderInfo, setOrderInfo] = useState<GetMerchantOrderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payKey, setPayKey] = useState("")
  const [currentStep, setCurrentStep] = useState<'method' | 'pay'>('method')
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  /* 获取用户支付配置 */
  const [userPayConfigs, setUserPayConfigs] = useState<UserPayConfig[]>([])

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const configs = await ConfigService.getUserPayConfigs()
        setUserPayConfigs(configs)
      } catch (error) {
        console.error("Failed to load user pay configs:", error)
      }
    }
    loadConfigs()
  }, [])

  /* 统一的服务错误处理函数 */
  const handleServiceError = (error: unknown, operation: string) => {
    console.error(`${ operation }失败:`, error)

    let errorMessage = `${ operation }失败`
    if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message)
    }

    const errorMap: Record<string, string> = {
      '不存在': "此积分流转服务不存在或已失效",
      '未登录': "请先登录后再进行认证",
      '余额不足': "账户积分不足",
      '支付密码': "安全密码错误",
      '不能支付': "不能支付自己创建的积分流转服务",
      '每日限额': "已达到每日认证限额",
    }

    const userMessage = Object.entries(errorMap).find(([key]) =>
      errorMessage.includes(key)
    )?.[1] || errorMessage

    toast.error(userMessage, { id: 'payment-error' })
  }

  /* 组件初始化时查询支付链接信息 */
  useEffect(() => {
    if (token) {
      setError(false)
      handleQueryPaymentLink(token)
    } else {
      setLoading(false)
      setError(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userPayConfigs.length, user?.pay_level])

  /* 查询支付链接信息 */
  const handleQueryPaymentLink = async (queryToken?: string) => {
    const targetToken = queryToken || token
    if (!targetToken) {
      toast.error("缺少支付链接", { id: 'missing-token' })
      return
    }

    setLoading(true)
    setLoading(true)
    try {
      const data = await services.merchant.getPaymentLinkByToken(targetToken)
      setPaymentLink(data)

      /* 将支付链接信息转换为订单信息格式，以复用PayingInfo和PayingNow组件 */
      const mockOrderInfo: GetMerchantOrderResponse = {
        merchant: {
          app_name: data.app_name || "商户",
          redirect_uri: data.redirect_uri || "",
        },
        order: {
          id: '0',
          order_no: `LINK-${ data.id }`,
          order_name: data.product_name,
          payer_username: user?.username || "",
          payee_username: "",
          amount: data.amount,
          status: "pending",
          type: "payment",
          payment_type: "link",
          remark: data.remark || "",
          client_id: "",
          return_url: "",
          notify_url: "",
          trade_time: null,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
        user_pay_config: (() => {
          const currentUserConfig = userPayConfigs.find(c => user?.pay_level !== undefined && c.level === user.pay_level)
          return currentUserConfig ? {
            ...currentUserConfig,
            fee_rate: String(currentUserConfig.fee_rate)
          } : {
            id: '0',
            level: user?.pay_level ?? 0,
            min_score: 0,
            max_score: null,
            daily_limit: null,
            fee_rate: "0.00",
            created_at: "",
            updated_at: ""
          }
        })(),
      }

      setOrderInfo(mockOrderInfo)
      setError(false)
    } catch (error: unknown) {
      handleServiceError(error, "查询积分流转服务")
      setPaymentLink(null)
      setOrderInfo(null)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  /* 执行支付操作 */
  const handlePayOrder = async () => {
    if (!paymentLink || !token) return

    if (!payKey.trim()) {
      toast.error("请输入安全密码")
      return
    }

    if (payKey.length < 6 || payKey.length > 10) {
      toast.error("安全密码长度必须为6位")
      return
    }

    setPaying(true)
    try {
      await services.merchant.payByLink({
        token: token,
        pay_key: payKey,
        remark: paymentLink.remark || undefined
      })

      toast.success("积分流转服务认证成功！", { id: 'payment-success' })

      /* 支付成功后更新订单状态 */
      if (orderInfo) {
        setOrderInfo({
          ...orderInfo,
          order: {
            ...orderInfo.order,
            status: 'success'
          }
        })
      }

      /* 5秒后跳转到首页或回调地址 */
      timeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return

        const redirectUri = orderInfo?.merchant?.redirect_uri
        if (redirectUri && redirectUri.trim()) {
          window.location.href = redirectUri
          return
        }

        window.location.href = '/home'
      }, 5000)
    } catch (error: unknown) {
      handleServiceError(error, "认证")
    } finally {
      setPaying(false)
    }
  }

  if (error) {
    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
          <motion.div
            className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
          >
            <div className="w-full rounded-3xl p-8 max-w-lg">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-500/10">
                <div className="size-8 text-red-500 font-bold text-4xl flex items-center justify-center">!</div>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">
                出了点问题
              </h1>
              <p className="text-muted-foreground text-sm">
                您访问的积分流转服务不存在或已失效。请检查链接地址是否正确，对此如有疑问请联系社区技术支持。
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full font-sans text-foreground overflow-hidden bg-background selection:bg-primary/30">
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col md:flex-row w-full max-w-4xl bg-card/70 backdrop-blur-2xl border border-border/50 rounded-3xl overflow-hidden shadow-2xl"
            style={{ minHeight: 'auto' }}
          >
            <PayingInfo orderInfo={orderInfo!} loading={loading} />
            <PayingNow
              orderInfo={orderInfo}
              paying={paying}
              payKey={payKey}
              currentStep={currentStep}
              selectedMethod={selectedMethod}
              isOpen={isOpen}
              loading={loading}
              onPayKeyChange={setPayKey}
              onCurrentStepChange={setCurrentStep}
              onSelectedMethodChange={setSelectedMethod}
              onIsOpenChange={setIsOpen}
              onPayOrder={handlePayOrder}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
