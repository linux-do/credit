"use client"

import { useEffect, useRef } from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, useSonner, type ToasterProps } from "sonner"
import { useBellRing } from "@/contexts/bell-ring-context"

/**
 * Toast 观察器组件
 * 监听 toast 事件并触发铃铛响铃动画
 */
function ToastObserver() {
  const { toasts } = useSonner()
  const { triggerRing } = useBellRing()
  const prevToastCountRef = useRef(0)

  useEffect(() => {
    // 当 toast 数量增加时触发响铃
    if (toasts.length > prevToastCountRef.current) {
      triggerRing()
    }
    prevToastCountRef.current = toasts.length
  }, [toasts.length, triggerRing])

  return null
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <>
      <ToastObserver />
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        icons={{
          success: <CircleCheckIcon className="size-4" />,
          info: <InfoIcon className="size-4" />,
          warning: <TriangleAlertIcon className="size-4" />,
          error: <OctagonXIcon className="size-4" />,
          loading: <Loader2Icon className="size-4 animate-spin" />,
        }}
        style={
          {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
            "--border-radius": "var(--radius)",
          } as React.CSSProperties
        }
        {...props}
      />
    </>
  )
}

export { Toaster }

