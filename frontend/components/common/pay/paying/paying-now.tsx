import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Send } from "@/components/animate-ui/icons/send"
import { Check } from "@/components/animate-ui/icons/check"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/animate-ui/primitives/radix/collapsible"
import { AlertCircle, CreditCard, ArrowLeft, ShieldCheck, Lock } from "lucide-react"

import type { GetMerchantOrderResponse } from "@/lib/services"
import { useUser } from "@/contexts/user-context"


type PaymentStep = typeof PAYMENT_STEPS[keyof typeof PAYMENT_STEPS]

const PAYMENT_METHODS = {
  LINUX_DO_PAY: 'linux-do-pay'
} as const

const PAYMENT_STEPS = {
  METHOD: 'method' as const,
  Credit: 'pay' as const
} as const

const ORDER_STATUSES = {
  SUCCESS: 'success',
  PENDING: 'pending'
} as const

/**
 * 加载中骨架组件
 * 显示支付方式加载中的骨架
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6 w-full max-w-xs mx-auto">
      <div className="space-y-3">
        <Skeleton className="h-6 w-32 bg-muted/50" />
        <Skeleton className="h-4 w-48 bg-muted/50" />
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-border/50 p-3 bg-card/50">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-9 h-9 rounded-lg bg-muted/50" />
            <Skeleton className="h-3.5 w-24 bg-muted/50" />
          </div>
        </div>

        <div className="rounded-xl border border-border/50 p-3 bg-card/50">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-9 h-9 rounded-lg bg-muted/50" />
            <Skeleton className="h-3.5 w-20 bg-muted/50" />
          </div>
        </div>
      </div>

      <Skeleton className="h-10 w-full rounded-full bg-muted/50" />
    </div>
  )
}

/**
 * 成功状态组件
 * 显示认证成功状态
 */
function SuccessState() {
  const [countdown, setCountdown] = React.useState(5)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.6,
        ease: "easeOut",
        type: "spring",
        stiffness: 100
      }}
      className="text-center py-10"
    >
      <div className="relative inline-block mb-6">
        <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.2,
            duration: 0.5,
            type: "spring",
            stiffness: 200
          }}
          className="relative w-10 h-10 bg-green-500 rounded-full flex items-center justify-center "
        >
          <Check
            className="size-6 text-white"
            animate={true}
            loop={false}
          />
        </motion.div>
      </div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="text-xl font-bold text-foreground mb-2"
      >
        认证成功
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="text-muted-foreground text-sm"
      >
        认证已安全完成，{countdown > 0 ? `${ countdown }秒后自动跳转...` : '正在跳转...'}
      </motion.p>
    </motion.div>
  )
}

/**
 * 认证方式选择步骤组件
 * 显示认证方式选择步骤
 */
function MethodSelectionStep({
  orderInfo,
  selectedMethod,
  isOpen,
  onSelectedMethodChange,
  onIsOpenChange,
  onCurrentStepChange,
  forceMobile = false
}: {
  orderInfo: GetMerchantOrderResponse
  selectedMethod: string
  isOpen: boolean
  onSelectedMethodChange: (method: string) => void
  onIsOpenChange: (isOpen: boolean) => void
  onCurrentStepChange: (step: PaymentStep) => void
  forceMobile?: boolean
}) {
  const { user } = useUser()

  return (
    <motion.div
      key="method-step"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 w-full max-w-xs mx-auto"
    >
      <div className={`space-y-2 text-center ${ forceMobile ? '' : 'md:text-left' }`}>
        <h2 className="text-xl font-bold text-foreground tracking-tight">选择认证平台</h2>
        <p className="text-xs text-muted-foreground">请选择您想要使用的服务认证平台</p>
      </div>

      <div className="space-y-3">
        <Collapsible open={isOpen} onOpenChange={onIsOpenChange}>
          <CollapsibleTrigger asChild>
            <div
              className={`group cursor-pointer rounded-xl p-2.5 transition-all duration-300 border backdrop-blur-sm ${ selectedMethod === PAYMENT_METHODS.LINUX_DO_PAY
                ? 'border-primary/50 bg-primary/5'
                : 'border-border/50 bg-card hover:bg-muted/50 hover:border-border'
                }`}
              onClick={() => {
                if (selectedMethod === PAYMENT_METHODS.LINUX_DO_PAY) {
                  onSelectedMethodChange('')
                  onIsOpenChange(false)
                } else {
                  onSelectedMethodChange(PAYMENT_METHODS.LINUX_DO_PAY)
                  onIsOpenChange(true)
                }
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${ selectedMethod === PAYMENT_METHODS.LINUX_DO_PAY
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                  }`}>
                  <CreditCard className="size-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-xs text-foreground">LINUX DO Credit</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">即时安全认证</div>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${ selectedMethod === PAYMENT_METHODS.LINUX_DO_PAY
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border'
                  }`}>
                  {selectedMethod === PAYMENT_METHODS.LINUX_DO_PAY && <Check className="size-3" />}
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          {selectedMethod === PAYMENT_METHODS.LINUX_DO_PAY && (
            <CollapsibleContent>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-3 px-1"
              >
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground mb-4 bg-muted/50 p-2.5 rounded-lg border">
                  <div className="p-1 rounded">
                    <Lock className="size-3 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] opacity-70">消费方账户</span>
                    <span className="font-medium text-foreground">{orderInfo.order.payer_username || user?.username}</span>
                  </div>
                </div>
                <Button
                  onClick={() => onCurrentStepChange(PAYMENT_STEPS.Credit)}
                  className="w-full rounded-full font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  确认并继续
                </Button>
              </motion.div>
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    </motion.div>
  )
}

/**
 * 认证步骤组件
 * 显示认证步骤
 */
function PaymentStep({
  orderInfo,
  payKey,
  paying,
  onPayKeyChange,
  onCurrentStepChange,
  onPayOrder
}: {
  orderInfo: GetMerchantOrderResponse
  payKey: string
  paying: boolean
  onPayKeyChange: (value: string) => void
  onCurrentStepChange: (step: PaymentStep) => void
  onPayOrder: () => void
}) {
  return (
    <motion.div
      key="pay-step"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 w-full max-w-xs mx-auto"
    >
      <div className="space-y-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-muted-foreground hover:text-foreground mb-1"
          onClick={() => onCurrentStepChange(PAYMENT_STEPS.METHOD)}
        >
          <ArrowLeft className="size-3.5 mr-1" /> 返回
        </Button>
        <h2 className="text-xl font-bold text-foreground tracking-tight">身份验证</h2>
        <p className="text-xs text-muted-foreground">请输入您的6位安全密码</p>
      </div>

      <div className="flex justify-center py-4">
        <InputOTP
          maxLength={6}
          value={payKey}
          onChange={onPayKeyChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && payKey.length === 6 && !paying) {
              onPayOrder()
            }
          }}
        >
          <InputOTPGroup className="gap-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="size-11 bg-background border-border text-foreground text-lg font-bold transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 ring-offset-0"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        onClick={onPayOrder}
        disabled={paying || payKey.length !== 6}
        className="w-full rounded-full font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        {paying ? (
          <span className="flex items-center gap-2">
            <Send className="size-4" animate={true} loop={true} loopDelay={2000} /> 处理中...
          </span>
        ) : (
          `消耗 LDC ${ (parseFloat(orderInfo.order.amount)).toFixed(2) }`
        )}
      </Button>
    </motion.div>
  )
}

/**
 * 错误状态组件
 * 显示错误状态
 */
function ErrorState({ status }: { status: string }) {
  return (
    <div className="text-center py-10">
      <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
        <AlertCircle className="size-6 text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1">认证出现问题</h3>
      <p className="text-muted-foreground text-sm">状态：<span className="font-medium text-foreground">{status}</span></p>
    </div>
  )
}

/**
 * 底部组件
 * 显示底部
 */
function Footer({ loading }: { loading?: boolean }) {
  return loading ? (
    <div className="flex flex-col items-center justify-center space-y-2 mt-8 opacity-50">
      <Skeleton className="h-3 w-32" />
    </div>
  ) : (
    <div className="flex items-center justify-center gap-2 text-[10px] uppercase font-bold text-muted-foreground/40 mt-10">
      <ShieldCheck className="size-3 text-green-500" />
      <span>由 LINUX DO Credit 提供安全认证</span>
    </div>
  )
}

interface PayingNowProps {
  orderInfo: GetMerchantOrderResponse | null
  paying: boolean
  payKey: string
  currentStep: PaymentStep
  selectedMethod: string
  isOpen: boolean
  loading?: boolean
  onPayKeyChange: (value: string) => void
  onCurrentStepChange: (step: PaymentStep) => void
  onSelectedMethodChange: (method: string) => void
  onIsOpenChange: (isOpen: boolean) => void
  onPayOrder: () => void
  forceMobile?: boolean
}

/**
 * 支付现在组件
 * 显示支付现在组件
 */
export function PayingNow({
  orderInfo,
  paying,
  payKey,
  currentStep,
  selectedMethod,
  isOpen,
  loading = false,
  onPayKeyChange,
  onCurrentStepChange,
  onSelectedMethodChange,
  onIsOpenChange,
  onPayOrder,
  forceMobile = false
}: PayingNowProps) {
  const renderContent = () => {
    if (loading) return <LoadingSkeleton />

    if (!orderInfo) return null

    switch (orderInfo.order.status) {
      case ORDER_STATUSES.SUCCESS:
        return <SuccessState />

      case ORDER_STATUSES.PENDING:
        return (
          <AnimatePresence mode="wait">
            {currentStep === PAYMENT_STEPS.METHOD ? (
              <MethodSelectionStep
                orderInfo={orderInfo}
                selectedMethod={selectedMethod}
                isOpen={isOpen}
                onSelectedMethodChange={onSelectedMethodChange}
                onIsOpenChange={onIsOpenChange}
                onCurrentStepChange={onCurrentStepChange}
                forceMobile={forceMobile}
              />
            ) : (
              <PaymentStep
                orderInfo={orderInfo}
                payKey={payKey}
                paying={paying}
                onPayKeyChange={onPayKeyChange}
                onCurrentStepChange={onCurrentStepChange}
                onPayOrder={onPayOrder}
              />
            )}
          </AnimatePresence>
        )

      default:
        return <ErrorState status={orderInfo.order.status} />
    }
  }

  return (
    <div className={`flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-white dark:bg-neutral-900 transition-colors duration-500 ${ forceMobile ? '' : 'md:p-8' }`}>
      <div className="w-full relative z-10 flex flex-col h-full justify-center">
        <div className="flex-1 flex flex-col justify-center">
          {renderContent()}
        </div>
        <Footer loading={loading} />
      </div>
    </div>
  )
}
