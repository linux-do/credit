"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AdminService } from "@/lib/services"
import type { PublicAccount } from "@/lib/services/admin/types"
import { Link2, Loader2 } from "lucide-react"
import { toast } from "sonner"

/**
 * 公共账号绑定按钮（展示在用户列表每行的操作栏，仅真实用户）
 *
 * @param userId - 目标真实用户 ID
 * @param boundPublicAccountIds - 当前已绑定的公共账号 ID 列表
 * @param onChanged - 绑定保存成功后的回调（刷新列表）
 *
 * @remarks
 * 多对多绑定：保存时全量同步（先清空该用户全部绑定再按勾选重建）。
 */
export function BindPublicAccountButton({
  userId,
  boundPublicAccountIds,
  onChanged,
}: {
  userId: string
  boundPublicAccountIds: string[]
  onChanged: () => void
}) {
  const [open, setOpen] = useState(false)
  const [publicAccounts, setPublicAccounts] = useState<PublicAccount[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pending, setPending] = useState(false)

  // 打开对话框时加载公共账号列表并初始化勾选状态
  useEffect(() => {
    if (!open) return
    setLoadingList(true)
    setSelectedIds(boundPublicAccountIds)
    AdminService.listPublicAccounts()
      .then((res) => setPublicAccounts(res.users))
      .catch((err) => {
        toast.error("加载公共账号列表失败", {
          description: err instanceof Error ? err.message : "未知错误",
        })
      })
      .finally(() => setLoadingList(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const toggleAccount = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((item) => item !== id)))
  }

  const handleSave = async () => {
    setPending(true)
    try {
      await AdminService.bindPublicAccounts(userId, selectedIds)
      toast.success("已保存公共账号授权")
      setOpen(false)
      onChanged()
    } catch (err) {
      toast.error("保存失败", {
        description: err instanceof Error ? err.message : "未知错误",
      })
    } finally {
      setPending(false)
    }
  }

  const boundCount = boundPublicAccountIds.length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 text-muted-foreground hover:text-foreground ${boundCount > 0 ? "text-primary hover:text-primary" : ""}`}
                >
                  <Link2 className="size-3" />
                </Button>
              </DialogTrigger>
              {boundCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3 min-w-3 items-center justify-center rounded-full bg-primary px-0.5 text-[8px] font-medium text-primary-foreground">
                  {boundCount}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {boundCount > 0 ? `已授权 ${boundCount} 个公共账号` : "授权公共账号"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>授权公共账号</DialogTitle>
          <DialogDescription>
            勾选该用户可切换的公共账号，保存后全量生效。一个公共账号可同时授权给多个用户。
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[320px] overflow-y-auto rounded-md border border-border/60 p-2">
          {loadingList ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              加载中...
            </div>
          ) : publicAccounts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">暂无公共账号</div>
          ) : (
            publicAccounts.map((account) => (
              <label
                key={account.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted"
              >
                <Checkbox
                  checked={selectedIds.includes(account.id)}
                  onCheckedChange={(checked) => toggleAccount(account.id, checked === true)}
                  disabled={pending}
                />
                <span className="text-sm">@{account.username}</span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  ID: {account.id}
                </span>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={pending || loadingList}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
