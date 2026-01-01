"use client"

import * as React from "react"
import { useState } from "react"
import { toast } from "sonner"
import { Power, PowerOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { MerchantAPIKey, UpdateAPIKeyRequest } from "@/lib/services"

interface TestModeToggleProps {
  /** API Key */
  apiKey: MerchantAPIKey
  /** 更新回调 */
  onUpdate?: (updatedKey: MerchantAPIKey) => void
  /** 更新 API Key */
  updateAPIKey?: (id: string, data: UpdateAPIKeyRequest) => Promise<void>
}

/**
 * 测试模式切换组件
 * 提供测试模式开关按钮，带有详细的说明提示
 */
export function TestModeToggle({ apiKey, onUpdate, updateAPIKey }: TestModeToggleProps) {
  const [open, setOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [pendingValue, setPendingValue] = useState<boolean>(false)

  const handleToggle = async () => {
    try {
      setProcessing(true)

      const updateData = {
        app_name: apiKey.app_name,
        app_homepage_url: apiKey.app_homepage_url,
        app_description: apiKey.app_description,
        redirect_uri: apiKey.redirect_uri,
        notify_url: apiKey.notify_url,
        test_mode: pendingValue
      }

      if (updateAPIKey) {
        await updateAPIKey(apiKey.id, updateData)
      } else {
        const services = await import("@/lib/services")
        await services.default.merchant.updateAPIKey(apiKey.id, updateData)
      }

      toast.success(pendingValue ? '测试模式已开启' : '测试模式已关闭', {
        description: pendingValue
          ? '现在订单不会真实扣费，仅用于测试调试'
          : '现在订单将正常扣费，可以接收真实付款'
      })

      const updatedKey = { ...apiKey, test_mode: pendingValue }
      onUpdate?.(updatedKey)
      setOpen(false)
    } catch (error) {
      const errorMessage = (error as Error).message || '更新测试模式失败'
      toast.error('更新失败', { description: errorMessage })
    } finally {
      setProcessing(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setPendingValue(!apiKey.test_mode)
    setOpen(true)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          onClick={handleClick}
          className={`h-8 text-xs border-dashed w-full ${ apiKey.test_mode
            ? "text-orange-600 border-orange-500/50 hover:bg-orange-500/10"
            : "text-green-600 border-green-500/50 hover:bg-green-500/10"
            }`}
        >
          {apiKey.test_mode ? (
            <Power className="size-3 mr-1" />
          ) : (
            <PowerOff className="size-3 mr-1" />
          )}
          {apiKey.test_mode ? "关闭测试" : "开启测试"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {pendingValue ? (
              <>
                <Power className="size-5 text-orange-600" />
                开启测试模式
              </>
            ) : (
              <>
                <PowerOff className="size-5 text-green-600" />
                关闭测试模式
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              {pendingValue ? (
                <>
                  <p className="font-medium">测试模式开启后：</p>
                  <ul className="space-y-2 ml-4 list-disc text-muted-foreground">
                    <li><strong>订单不会真实扣费</strong>：用户余额不会扣减</li>
                    <li><strong>商户不会收款</strong>：你的余额不会增加</li>
                    <li><strong>仅限自己测试</strong>：只有你可以支付测试订单</li>
                    <li><strong>订单标记明显</strong>：测试订单会显示警告标识</li>
                  </ul>
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                    <p className="text-xs text-orange-800 dark:text-orange-300">
                      <strong>使用场景：</strong>在正式上线前测试支付流程、回调通知等功能
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium">测试模式关闭后：</p>
                  <ul className="space-y-2 ml-4 list-disc text-muted-foreground">
                    <li><strong>订单真实扣费</strong>：用户余额会正常扣减</li>
                    <li><strong>商户正常收款</strong>：你的余额会正常增加</li>
                    <li><strong>其他用户可支付</strong>：任何人都可以支付订单</li>
                    <li><strong>正式生产环境</strong>：可以接收真实的业务订单</li>
                  </ul>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-xs text-green-800 dark:text-green-300">
                      <strong>注意：</strong>关闭后应用将进入生产模式，请确保已完成测试
                    </p>
                  </div>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={processing}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleToggle()
            }}
            disabled={processing}
            className={pendingValue ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}
          >
            {processing ? (
              <>
                <Spinner className="size-4" />
                {pendingValue ? '开启中' : '关闭中'}
              </>
            ) : (
              pendingValue ? '确认开启' : '确认关闭'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
