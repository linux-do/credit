"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { SquareArrowUpRight } from 'lucide-react';

import { cn } from "@/lib/utils"
import services from "@/lib/services"
import { termsSections, privacySections } from "./login-policies"


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
      <div className="grid gap-4 mx-4">
        <Button
          variant="default"
          type="button"
          className="w-full h-10 rounded-full tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? <Spinner className="mr-2" /> : <SquareArrowUpRight className="mr-2 h-4 w-4" />}
          {isLoading ? "正在跳转..." : "使用 LINUX DO 登录"}
        </Button>

      </div>

      <div className="text-muted-foreground text-center text-xs text-balance opacity-75 hover:opacity-100 transition-opacity">
        登录即代表您同意我们的{" "}
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="underline underline-offset-4 hover:text-foreground"
            >
              服务条款
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>服务条款</DialogTitle>
              <DialogDescription>请仔细阅读以下条款，使用本服务即表示您接受。</DialogDescription>
            </DialogHeader>
            <Accordion type="single" collapsible className="w-full">
              {termsSections.map((section) => (
                <AccordionItem key={section.value} value={section.value}>
                  <AccordionTrigger>{section.title}</AccordionTrigger>
                  <AccordionContent>{section.content}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </DialogContent>
        </Dialog>
        {" "}及{" "}
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="underline underline-offset-4 hover:text-foreground"
            >
              隐私政策
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>隐私政策</DialogTitle>
              <DialogDescription>我们重视您的隐私，以下说明信息如何收集与使用。</DialogDescription>
            </DialogHeader>
            <Accordion type="single" collapsible className="w-full">
              {privacySections.map((section) => (
                <AccordionItem key={section.value} value={section.value}>
                  <AccordionTrigger>{section.title}</AccordionTrigger>
                  <AccordionContent>{section.content}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </DialogContent>
        </Dialog>
        .
      </div>
    </div>
  )
}
