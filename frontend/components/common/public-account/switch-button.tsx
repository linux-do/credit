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
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser } from "@/contexts/user-context"
import type { PublicAccountInfo } from "@/lib/services/user/types"
import { Loader2, UserRoundCog } from "lucide-react"
import { toast } from "sonner"

/**
 * 公共账号切换按钮（展示在顶部 header）
 *
 * 仅真实身份且绑定了公共账号时显示：下拉列出所有绑定的公共账号供切换。
 * 切换后恢复原身份需退出登录后重新登录（与管理端切换一致）。
 *
 * @remarks
 * 切换成功后重新加载页面，以新身份重新加载数据。
 */
export function PublicAccountSwitchButton() {
  const { user, publicAccounts, switchPublicAccount } = useUser()
  const [pending, setPending] = useState(false)
  const [switchTarget, setSwitchTarget] = useState<PublicAccountInfo | null>(null)

  const accounts = publicAccounts?.public_accounts ?? []
  const canSwitch = !!user && Number(user.id) > 0 && accounts.length > 0

  if (!canSwitch) return null

  const handleSwitch = async () => {
    if (!switchTarget) return
    setPending(true)
    try {
      await switchPublicAccount(switchTarget.id)
    } catch (err) {
      toast.error("切换失败", {
        description: err instanceof Error ? err.message : "未知错误",
      })
      setPending(false)
    }
    // 成功后 context 内部会刷新页面，无需重置状态
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground hover:text-foreground"
            title="切换为公共账号"
          >
            <UserRoundCog className="size-[18px]" />
            <span className="sr-only">切换为公共账号</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {accounts.map((account) => (
            <DropdownMenuItem key={account.id} onClick={() => setSwitchTarget(account)}>
              <span className="font-mono text-xs text-muted-foreground">{account.id}</span>
              <span className="ml-2">@{account.username}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!switchTarget} onOpenChange={(open) => !open && setSwitchTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>切换到公共账号？</AlertDialogTitle>
            <AlertDialogDescription>
              切换后当前会话身份将变为公共账号 @{switchTarget?.username}（ID: {switchTarget?.id}）
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleSwitch} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
