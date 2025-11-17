"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { LoginForm } from "@/components/auth/login-form"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { CreditCard, Check } from "lucide-react"

import services from "@/lib/services"


/**
 * 登录页面组件
 * 显示登录表单和登录按钮
 * 
 * @example
 * ```tsx
 * <LoginPage />
 * ```
 * @returns {React.ReactNode} 登录页面组件
 */
export function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  /* 是否正在处理OAuth回调 */
  const [isProcessingCallback, setIsProcessingCallback] = useState(() => {
    const state = searchParams.get('state')
    const code = searchParams.get('code')
    return !!(state && code)
  })

  const [loginSuccess, setLoginSuccess] = useState(false)
  const [needsPayKeySetup, setNeedsPayKeySetup] = useState(false)

  const [payKey, setPayKey] = useState("")
  const [confirmPayKey, setConfirmPayKey] = useState("")
  const [isSubmittingPayKey, setIsSubmittingPayKey] = useState(false)
  const [setupStep, setSetupStep] = useState<'password' | 'confirm'>('password')

  const isPayKeyValid = payKey.length === 6 && /^\d{6}$/.test(payKey)
  const isConfirmValid = confirmPayKey.length === 6 && /^\d{6}$/.test(confirmPayKey)
  const passwordsMatch = payKey === confirmPayKey

  /* 处理支付密码输入 */
  const handlePayKeyChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    setPayKey(numericValue)
  }

  /* 处理确认支付密码输入 */
  const handleConfirmPayKeyChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    setConfirmPayKey(numericValue)
  }
  
  /* 标语 */
  const slogans = [
    "Fast and convenient payment solution.",
    "Pay your bills with ease and security.",
    "Secure transactions, anytime, anywhere.",
    "Your trusted payment partner."
  ]
  /* 当前标语索引 */
  const [currentSloganIndex, setCurrentSloganIndex] = useState(0)
  
  /* 定时更新标语 */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSloganIndex((prev) => (prev + 1) % slogans.length)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [slogans.length])

  /* 处理OAuth回调 */
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const state = searchParams.get('state')
      const code = searchParams.get('code')

      if (state && code) {
        setIsProcessingCallback(true)
        try {
          /* 第一步：处理OAuth回调 */
          await services.auth.handleCallback({ state, code })

          /* 第二步：获取用户信息 */
          const user = await services.auth.getUserInfo()

          /* 第三步：检查是否需要设置支付密码 */
          if (!user.is_pay_key) {
            setNeedsPayKeySetup(true)
          } else {
            setLoginSuccess(true)
            toast.success("登录成功")

            setTimeout(() => {
              router.replace('/home')
            }, 1500)
          }
        } catch (error) {
          console.error('OAuth callback error:', error)
          toast.error(error instanceof Error ? error.message : "登录失败，请重试")
          setIsProcessingCallback(false)
          router.replace('/login')
        }
      }
    }
    handleOAuthCallback()
  }, [searchParams, router])



  /* 处理支付密码设置提交 */
  const handlePayKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (setupStep === 'password') {
      /* 第一步：验证支付密码格式 */
      if (!isPayKeyValid) {
        toast.error("支付密码必须为6位数字")
        return
      }
      setSetupStep('confirm')
    } else {
      /* 第二步：验证确认密码并提交 */
      if (!isConfirmValid) {
        toast.error("确认密码必须为6位数字")
        return
      }

      if (!passwordsMatch) {
        toast.error("两次输入的支付密码不一致")
        /* 重置到第一步重新输入 */
        setSetupStep('password')
        setConfirmPayKey("")
        return
      }

      setIsSubmittingPayKey(true)
      try {
        await services.user.updatePayKey(payKey)
        toast.success("支付密码设置成功")
        setNeedsPayKeySetup(false)
        setLoginSuccess(true)
        setPayKey("")
        setConfirmPayKey("")
        setSetupStep('password')
        setTimeout(() => {
          router.replace('/home')
        }, 1500)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "设置支付密码失败"
        toast.error(errorMessage)
        setSetupStep('password')
        setConfirmPayKey("")
      } finally {
        setIsSubmittingPayKey(false)
      }
    }
  }

  /* 渲染支付密码设置表单 */
  const renderPayKeySetup = (key: string) => (
    <motion.div
      key={key}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-xs mx-auto space-y-6"
    >
      <div className="relative text-center space-y-2">
        <AnimatePresence mode="wait">
          {setupStep === 'password' ? (
            <motion.div
              key="password-header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold">设置支付密码</h3>
              <p className="text-sm text-muted-foreground">
                为确保账户安全，请先设置6位数字支付密码
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="confirm-header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold">确认支付密码</h3>
              <p className="text-sm text-muted-foreground">
                请再次输入相同的密码进行确认
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handlePayKeySubmit} className="space-y-6 w-full">
          <AnimatePresence mode="wait">
            {setupStep === 'password' ? (
            <motion.div
              key="password-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={payKey}
                onChange={handlePayKeyChange}
                disabled={isSubmittingPayKey}
                autoFocus
                error={!passwordsMatch && confirmPayKey.length === 6}
              >
                  <InputOTPGroup className="gap-1">
                    <InputOTPSlot index={0} className="w-10 h-10" />
                    <InputOTPSlot index={1} className="w-10 h-10" />
                    <InputOTPSlot index={2} className="w-10 h-10" />
                    <InputOTPSlot index={3} className="w-10 h-10" />
                    <InputOTPSlot index={4} className="w-10 h-10" />
                    <InputOTPSlot index={5} className="w-10 h-10" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="confirm-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={confirmPayKey}
                onChange={handleConfirmPayKeyChange}
                disabled={isSubmittingPayKey}
                autoFocus
                error={!passwordsMatch && confirmPayKey.length === 6}
              >
                  <InputOTPGroup className="gap-1">
                    <InputOTPSlot index={0} className="w-10 h-10" />
                    <InputOTPSlot index={1} className="w-10 h-10" />
                    <InputOTPSlot index={2} className="w-10 h-10" />
                    <InputOTPSlot index={3} className="w-10 h-10" />
                    <InputOTPSlot index={4} className="w-10 h-10" />
                    <InputOTPSlot index={5} className="w-10 h-10" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {!passwordsMatch && confirmPayKey.length === 6 && (
                <p className="text-xs text-red-500 text-center">
                  两次输入的密码不一致
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center w-full gap-3">
          <AnimatePresence mode="wait">
            {setupStep === 'confirm' && (
              <motion.div
                key="back-button"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSetupStep('password')
                    setConfirmPayKey('')
                  }}
                  className="w-[60px] font-bold"
                >
                  返回
                </Button>
              </motion.div>
            )}
            <motion.div
              key={`submit-${setupStep}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                type="submit"
                className={`w-auto font-bold ${setupStep === 'password' ? 'w-[220px]' : 'w-[160px]'}`}
                disabled={
                  setupStep === 'password'
                    ? !isPayKeyValid
                    : isSubmittingPayKey || !isConfirmValid
                }
              >
                {setupStep === 'password'
                  ? '继续'
                  : (isSubmittingPayKey ? <><Spinner/> 设置中</> : "完成")
                }
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
      </form>
    </motion.div>
  )

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex items-center justify-center">
              <CreditCard className="size-5" />
            </div>
            LINUX DO PAY
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <AnimatePresence mode="wait">
            {isProcessingCallback ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-4"
              >
                {needsPayKeySetup ? (
                  renderPayKeySetup("oauth-pay-key-setup")
                ) : loginSuccess ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                      className="mx-auto w-12 h-12 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <Check className="w-6 h-6 text-white" strokeWidth={3} />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <div className="text-lg font-semibold">验证成功</div>
                      <p className="text-sm text-muted-foreground">即将跳转至首页...</p>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-medium flex items-center justify-center gap-2">
                      <Spinner/>
                      <span>正在验证您的登录信息</span>
                    </div>
                    <p className="text-sm text-muted-foreground">请稍候，即将完成验证...</p>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-xs"
              >
                <LoginForm />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="relative hidden lg:flex items-center justify-center bg-muted">
        <div className="absolute inset-0 z-0">
          <AuroraBackground>
            <motion.div
              initial={{ opacity: 0.0 }}
              whileInView={{ opacity: 1 }}
              transition={{
                delay: 0.2,
                duration: 0.5,
                ease: "easeInOut",
              }}
              className="relative z-10 flex flex-col gap-4 items-center justify-center"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: 0.4,
                  duration: 0.4,
                  ease: "easeInOut",
                }}
                className="text-6xl font-bold dark:text-white text-center"
              >
                LINUX DO <span className="text-7xl italic font-serif text-blue-800 dark:text-blue-200">PAY</span>
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSloganIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut",
                  }}
                  className="text-2xl font-extralight dark:text-neutral-200"
                >
                  {slogans[currentSloganIndex]}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </AuroraBackground>
        </div>
      </div>
    </div>
  )
}
