"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion, AnimatePresence } from "motion/react"
import { ShieldCheck } from "lucide-react"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Spinner } from "@/components/ui/spinner"
import { UserService } from "@/lib/services/user"

export function SecurityMain() {
  const router = useRouter()
  const [setupStep, setSetupStep] = React.useState<'password' | 'confirm'>('password')
  const [payKey, setPayKey] = React.useState("")
  const [confirmPayKey, setConfirmPayKey] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const isPayKeyValid = payKey.length === 6 && /^\d{6}$/.test(payKey)
  const isConfirmValid = confirmPayKey.length === 6 && /^\d{6}$/.test(confirmPayKey)
  const passwordsMatch = payKey === confirmPayKey

  /* 安全密码输入 */
  const handlePayKeyChange = (value: string) => {
    const numericValue = value.replaceAll(/\D/g, '')
    setPayKey(numericValue)
  }

  /* 确认安全密码 */
  const handleConfirmPayKeyChange = (value: string) => {
    const numericValue = value.replaceAll(/\D/g, '')
    setConfirmPayKey(numericValue)
  }

  const handlePayKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (setupStep === 'password') {
      if (!isPayKeyValid) {
        toast.error("安全密码必须为6位数字")
        return
      }
      setSetupStep('confirm')
    } else {
      if (!isConfirmValid) {
        toast.error("确认密码必须为6位数字")
        return
      }

      if (!passwordsMatch) {
        toast.error("两次输入的安全密码不一致")
        setSetupStep('password')
        setConfirmPayKey("")
        return
      }

      setIsSubmitting(true)
      try {
        await UserService.updatePayKey(payKey)
        toast.success("修改成功", {
          description: "您的安全密码已成功更新",
        })
        
        // 立即退出
        router.push('/settings')
      } catch (error) {
        toast.error("修改失败", {
          description: error instanceof Error ? error.message : "更新密码时发生错误，请稍后重试",
        })
        setSetupStep('password')
        setConfirmPayKey("")
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="py-6 space-y-6">
      <div className="font-semibold">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/settings" className="text-base text-primary">设置</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-base font-semibold">安全设置</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="space-y-6">
        <div className="font-medium text-sm text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          密码安全
        </div>

        <div className="mt-8 flex justify-center">
          <motion.div 
            className="w-full max-w-sm space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={setupStep}
                initial={{ opacity: 0, x: setupStep === 'confirm' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="flex flex-col items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold tracking-tight text-center">
                    {setupStep === 'password' ? '设置新密码' : '确认新密码'}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-[320px] mx-auto">
                    {setupStep === 'password'
                      ? '请输入新的6位数字安全密码'
                      : '请再次输入密码进行确认'}
                  </p>
                </div>

                <form onSubmit={handlePayKeySubmit} className="space-y-6">
                  <div className="flex justify-center">
                    {setupStep === 'password' ? (
                      <InputOTP
                        maxLength={6}
                        value={payKey}
                        onChange={handlePayKeyChange}
                        disabled={isSubmitting}
                        autoFocus
                      >
                        <InputOTPGroup className="gap-2">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot key={i} index={i} className="w-10 h-10 sm:w-11 sm:h-11 border-input transition-all ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2" />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    ) : (
                      <div className="space-y-4">
                        <InputOTP
                          maxLength={6}
                          value={confirmPayKey}
                          onChange={handleConfirmPayKeyChange}
                          disabled={isSubmitting}
                          autoFocus
                        >
                          <InputOTPGroup className="gap-2">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <InputOTPSlot key={i} index={i} className="w-10 h-10 sm:w-11 sm:h-11 text-lg border-input transition-all ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2" />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                        {!passwordsMatch && confirmPayKey.length === 6 && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-red-500 text-center font-medium"
                          >
                            两次输入的密码不一致
                          </motion.p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 sm:mx-8">
                    {setupStep === 'confirm' && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setSetupStep('password')
                          setConfirmPayKey('')
                        }}
                        className="flex-1 h-10 rounded-full tracking-wide text-sm font-bold transition-all active:scale-95"
                      >
                        返回
                      </Button>
                    )}
                    <Button
                      type="submit"
                      className={`flex-1 h-10 rounded-full tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 ${setupStep === 'password' ? 'w-full' : ''}`}
                      disabled={
                        setupStep === 'password'
                          ? !isPayKeyValid
                          : isSubmitting || !isConfirmValid
                      }
                    >
                      {isSubmitting && <Spinner className="mr-2" />}
                      {setupStep === 'password' ? '继续' : '保存修改'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
