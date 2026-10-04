"use client"

import { useState } from "react"

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
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AdminService } from "@/lib/services"
import { Loader2, UserRoundCog } from "lucide-react"
import { toast } from "sonner"

/**
 * 切换账号身份入口（展示在用户列表每行的操作栏）
 * 
 * @param accountId - 目标账号 ID
 * @param username - 目标账号用户名（用于确认弹窗展示）
 * 
 * @remarks
 * 切换后 session 绑定用户被替换为目标账号，不影响目标账号自身的登录会话，
 * 只能退出登录后重新登录恢复原账号。
 */
export function SwitchAccountButton({ accountId, username }: { accountId: string, username: string }) {
  const [switching, setSwitching] = useState(false)

  const handleSwitch = async () => {
    setSwitching(true)
    try {
      await AdminService.switchAccount(accountId)
      // 切换成功后重新加载页面，清除残留数据并以目标账号身份重新加载
      window.location.reload()
    } catch (err) {
      toast.error("切换失败", {
        description: err instanceof Error ? err.message : "未知错误",
      })
      setSwitching(false)
    }
  }

  return (
    <AlertDialog>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  disabled={switching}
                >
                  {switching ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <UserRoundCog className="size-3" />
                  )}
                </Button>
              </AlertDialogTrigger>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            切换到此账号
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认切换账号？</AlertDialogTitle>
          <AlertDialogDescription>
            切换后当前会话身份将变为 @{username}（ID: {accountId}）
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleSwitch} disabled={switching}>
            {switching && <Loader2 className="h-4 w-4 animate-spin" />}
            确认切换
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
