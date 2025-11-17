"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple"

import { cn } from "@/lib/utils"
import services from "@/lib/services"


/**
 * 登录表单组件
 * 显示登录表单和登录按钮
 * 
 * @example
 * ```tsx
 * <LoginForm />
 * ```
 * @param {React.ComponentProps<"div">} props - 组件属性
 * @param {string} className - 组件类名
 * @returns {React.ReactNode} 登录表单组件
 */
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)

  /* 处理登录 */
  const handleLogin = async () => {
    setIsLoading(true)
    try {
      await services.auth.initiateLogin()
    } catch (error) {
      setIsLoading(false)
      console.error('Login error:', error)
      const message = error instanceof Error ? error.message : "登录失败，请重试"
      toast.error(message, {
        duration: 5000,
        description: error instanceof Error && error.name === 'NetworkError' 
          ? '请确认后端服务已启动' 
          : undefined
      })
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-xl font-bold">欢迎使用 LINUX DO PAY</h1>
        <p className="text-muted-foreground text-sm text-balance">
          使用 LINUX DO Connect 登录 LINUX DO Pay 平台
        </p>
      </div>
      <RippleButton
        variant="default"
        type="button"
        className="w-full font-bold"
        onClick={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? <><Spinner/>前往验证...</> : "LINUX DO 登录"}
      </RippleButton>
    </div>
  )
}
