"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Spinner } from "@/components/ui/spinner"
import { AlertTriangle, X, Layers, Banknote, TicketSlash } from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import type { Order, DisputeWithOrder, Dispute } from "@/lib/services"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DisputeService } from "@/lib/services"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"
import { usePublicConfig } from "@/hooks/use-public-config"
import { useTransaction } from "@/contexts/transaction-context"
import { useUser } from "@/contexts/user-context"
import { Textarea } from "@/components/ui/textarea"
import { typeConfig } from "@/components/common/general/table-filter"

/**
 * 活动详情弹窗
 */
export function OrderDetailDialog({ order }: { order: Order }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-1 text-xs rounded-full"
            onClick={() => setOpen(true)}
          >
            <Banknote className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>查看详情</p>
        </TooltipContent>
      </Tooltip>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>积分流转详情</DialogTitle>
          </DialogHeader>

          <div className="relative bg-card rounded-lg shadow-xl overflow-hidden">
            <div className="p-6 space-y-6 bg-card border border-border/50 rounded-lg">
              <div className="flex flex-col items-center space-y-2 pb-4 border-b-2 border-dashed border-border/50">
                <h3 className="font-bold text-2xl tracking-wider uppercase">{order.app_name || 'RECEIPT'}</h3>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                  {formatDateTime(order.created_at)}
                </p>
              </div>

              <div className="text-center py-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Credits</p>
                <div className="text-4xl font-black tracking-tighter flex items-start justify-center gap-1">
                  {parseFloat(order.amount).toFixed(2)}
                </div>
              </div>

              <div className="space-y-0 text-sm border-y-2 border-dashed border-border/50 py-4">
                <div className="flex justify-between items-center py-2 border-b border-dashed border-border/30 last:border-0">
                  <span className="text-muted-foreground text-xs uppercase font-medium">编号</span>
                  <span className="font-mono text-xs font-medium">{order.order_no}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-dashed border-border/30 last:border-0">
                  <span className="text-muted-foreground text-xs uppercase font-medium">类型</span>
                  <span className="text-xs font-medium">{typeConfig[order.type]?.label || order.type}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-dashed border-border/30 last:border-0">
                  <span className="text-muted-foreground text-xs uppercase font-medium">消费方</span>
                  <span className="text-xs font-medium">{order.payer_username}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-dashed border-border/30 last:border-0">
                  <span className="text-muted-foreground text-xs uppercase font-medium">服务方</span>
                  <span className="text-xs font-medium">{order.payee_username}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-dashed border-border/30 last:border-0">
                  <span className="text-muted-foreground text-xs uppercase font-medium">备注</span>
                  <span className="text-xs font-medium">{order.remark}</span>
                </div>
                {(order.status === 'success' || order.status === 'refund') && (
                  <div className="flex justify-between items-center py-2 border-b border-dashed border-border/30 last:border-0">
                    <span className="text-muted-foreground text-xs uppercase font-medium">时间</span>
                    <span className="font-mono text-xs">{formatDateTime(order.trade_time)}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col items-center space-y-3">
                <div className="h-8 w-full max-w-[200px] flex items-end justify-between opacity-40">
                  {[...Array(30)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-foreground w-[2px]"
                      style={{ height: `${ Math.max(40, Math.random() * 100) }%` }}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono tracking-wider text-center">
                  LINUX DO Credit
                </p>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_50%,hsl(var(--card))_50%)] bg-[length:16px_16px] -mb-2" />
          </div>

          <div className="mt-4 flex justify-center">
            <DialogClose asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8 text-xs rounded-full border border-border">
                <span className="sr-only">关闭</span>
                <X className="size-3.5 stroke-2" />
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * 发起争议弹窗
 */
export function CreateDisputeDialog({ order, onSuccess }: { order: Order; onSuccess?: () => void }) {
  const isMobile = useIsMobile()
  const { config: publicConfig, loading: configLoading, error: configError } = usePublicConfig()
  const { updateOrderStatus } = useTransaction()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState("")

  const resetForm = () => {
    setReason("")
  }

  const handleButtonClick = async () => {
    if (configLoading) {
      try {
        await new Promise(resolve => setTimeout(resolve, 100))
        if (configLoading) {
          toast.error('配置加载中', { description: '请稍候再试' })
          return
        }
      } catch {
        toast.error('配置加载失败', { description: '请刷新页面重试' })
        return
      }
    }

    if (configError || !publicConfig) {
      toast.error('无法获取配置', { description: configError?.message || '请刷新页面重试' })
      return
    }

    const tradeTime = new Date(order.trade_time)
    const expiryTime = new Date(tradeTime.getTime() + publicConfig.dispute_time_window_hours * 60 * 60 * 1000)
    const now = new Date()

    if (now > expiryTime) {
      toast.error('无法发起争议', { description: '已超过最晚发起争议时间' })
      return
    }

    setOpen(true)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      resetForm()
    }
    setOpen(newOpen)
  }

  const handleCreateDispute = async () => {
    if (!reason.trim()) {
      toast.error('表单验证失败', { description: '请填写争议原因' })
      return
    }

    if (reason.length > 100) {
      toast.error('表单验证失败', { description: '争议原因不能超过 100 个字符' })
      return
    }

    try {
      setLoading(true)
      await DisputeService.createDispute({ order_id: order.id, reason: reason.trim() })
      toast.success('争议已发起', { description: '请等待服务方处理' })
      updateOrderStatus(order.id, { status: 'disputing' })
      setOpen(false)
      resetForm()
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '发起争议失败'
      toast.error('发起争议失败', { description: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-1 text-xs rounded-full text-muted-foreground hover:text-foreground"
            onClick={handleButtonClick}
          >
            <AlertTriangle className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>发起争议</p>
        </TooltipContent>
      </Tooltip>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发起争议</DialogTitle>
            <DialogDescription>
              如果您对该积分活动有疑问，可以发起争议，服务方将在规定时间内处理。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason" className={isMobile ? "text-sm" : ""}>
                争议原因
              </Label>
              <Textarea
                id="reason"
                placeholder="请详细描述您遇到的问题..."
                maxLength={100}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading}
                className={isMobile ? "text-sm" : ""}
              />
              <p className="text-xs text-muted-foreground text-right">
                {reason.length}/100
              </p>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={loading} className="h-8 text-xs">
                取消
              </Button>
            </DialogClose>
            <Button
              onClick={(e) => { e.preventDefault(); handleCreateDispute() }}
              disabled={loading}
              className="bg-primary h-8 text-xs"
            >
              {loading ? <><Spinner /> 提交中</> : '确认发起'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * 取消争议弹窗
 */
export function CancelDisputeDialog({ order, onSuccess }: { order: Order; onSuccess?: () => void }) {
  const { updateOrderStatus } = useTransaction()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCancelDispute = async () => {
    try {
      setLoading(true)

      if (!order.dispute_id) {
        toast.error('取消争议失败', { description: '未找到争议记录' })
        return
      }

      await DisputeService.closeDispute({ dispute_id: order.dispute_id })
      toast.success('争议已取消', { description: '争议已成功取消' })
      updateOrderStatus(order.id, { status: 'success' })
      setOpen(false)
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '取消争议失败'
      toast.error('取消争议失败', { description: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-1 text-xs rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setOpen(true)}
          >
            <X className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>争议正在进行中，点击取消</p>
        </TooltipContent>
      </Tooltip>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>争议取消</DialogTitle>
            <DialogDescription>
              您确定取消当前的争议吗？取消后争议将恢复正常。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={loading} className="h-8 text-xs">
                取消
              </Button>
            </DialogClose>
            <Button
              onClick={(e) => { e.preventDefault(); handleCancelDispute() }}
              disabled={loading}
              className="bg-primary h-8 text-xs"
            >
              {loading ? <><Spinner /> 取消中</> : '确认取消'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * 查看争议历史弹窗
 */
export function ViewDisputeHistoryDialog({ order }: { order: Order }) {
  const [open, setOpen] = useState(false)
  const [disputeHistory, setDisputeHistory] = useState<Dispute | null>(null)
  const [fetchingHistory, setFetchingHistory] = useState(false)

  const resetForm = () => {
    setDisputeHistory(null)
  }

  const fetchDisputeHistory = async () => {
    try {
      setFetchingHistory(true)

      if (!order.dispute_id) {
        toast.error('获取争议记录失败', { description: '未找到争议记录' })
        return
      }

      const res = await DisputeService.listDisputes({
        page: 1,
        page_size: 1,
        dispute_id: order.dispute_id
      })

      if (res.disputes && res.disputes.length > 0) {
        setDisputeHistory(res.disputes[0])
      } else {
        toast.error('未找到争议记录')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取争议记录失败'
      toast.error('获取争议记录失败', { description: errorMessage })
    } finally {
      setFetchingHistory(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setOpen(true)
      fetchDisputeHistory()
    } else {
      setOpen(false)
      resetForm()
    }
  }

  const parseDisputeReason = (fullReason: string) => {
    const match = fullReason.match(/^(.*?)\[服务方拒绝理由: (.*?)\]$/)
    if (match) {
      return { userReason: match[1].trim(), merchantReason: match[2].trim() }
    }
    return { userReason: fullReason, merchantReason: null }
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-1 text-xs rounded-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            onClick={() => handleOpenChange(true)}
          >
            <Layers className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>争议已拒绝，点击查看</p>
        </TooltipContent>
      </Tooltip>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>争议详情</DialogTitle>
            <DialogDescription>查看争议处理记录</DialogDescription>
          </DialogHeader>

          {fetchingHistory ? (
            <div className="py-8 flex justify-center">
              <Spinner className="size-6" />
            </div>
          ) : disputeHistory ? (
            <div className="py-4 relative pl-4 border-l border-border/50 space-y-8 ml-2">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">消费方发起争议</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(disputeHistory.created_at)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    {parseDisputeReason(disputeHistory.reason).userReason}
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-destructive ring-4 ring-background" />
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-destructive">服务方驳回争议</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(disputeHistory.updated_at)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground bg-destructive/5 border border-destructive/10 p-3 rounded-md">
                    {parseDisputeReason(disputeHistory.reason).merchantReason || "未提供拒绝理由"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              无法加载争议记录
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" className="h-8 text-xs">
                关闭
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * 退款审核活动弹窗
 */
export function RefundReviewDialog({ order, onSuccess }: { order: Order; onSuccess?: () => void }) {
  const { updateOrderStatus } = useTransaction()
  const { refetch: refetchUser } = useUser()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'refund' | 'closed' | null>(null)
  const [reason, setReason] = useState("")

  const [disputeInfo, setDisputeInfo] = useState<DisputeWithOrder | null>(null)
  const [fetchingDispute, setFetchingDispute] = useState(false)

  const resetForm = () => {
    setAction(null)
    setReason("")
    setDisputeInfo(null)
  }

  const fetchDisputeInfo = async () => {
    try {
      setFetchingDispute(true)

      if (!order.dispute_id) {
        toast.error('获取争议详情失败', { description: '未找到争议记录' })
        return
      }

      const res = await DisputeService.listMerchantDisputes({
        page: 1,
        page_size: 1,
        dispute_id: order.dispute_id
      })

      if (res.disputes && res.disputes.length > 0) {
        setDisputeInfo(res.disputes[0])
      } else {
        toast.error('获取争议详情失败', { description: '未找到争议记录' })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取争议详情失败'
      toast.error('获取争议详情失败', { description: errorMessage })
    } finally {
      setFetchingDispute(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setOpen(true)
      fetchDisputeInfo()
    } else if (!loading) {
      setOpen(false)
      resetForm()
    }
  }

  const handleSubmit = async () => {
    if (!action) {
      toast.error('请选择处理方式')
      return
    }

    if (action === 'closed' && !reason.trim()) {
      toast.error('请填写拒绝原因')
      return
    }

    if (reason.length > 100) {
      toast.error('拒绝理由不能超过 100 个字符')
      return
    }

    try {
      setLoading(true)

      if (!order.dispute_id) {
        toast.error('处理失败', { description: '未找到争议记录' })
        return
      }

      await DisputeService.refundReview({
        dispute_id: order.dispute_id,
        status: action,
        reason: action === 'closed' ? reason.trim() : undefined,
      })

      toast.success('处理成功', {
        description: action === 'refund' ? '已同意积分退回，争议结束' : '已拒绝积分退回，此积分活动正常进行'
      })

      updateOrderStatus(order.id, {
        status: action === 'refund' ? 'refund' : 'success'
      })

      setOpen(false)
      resetForm()
      refetchUser()
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '处理争议失败'
      toast.error('处理争议失败', { description: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-1 text-xs rounded-full text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
            onClick={() => {
              setOpen(true)
              fetchDisputeInfo()
            }}
          >
            <AlertTriangle className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>处理争议</p>
        </TooltipContent>
      </Tooltip>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>处理争议</DialogTitle>
            <DialogDescription>
              请审核此争议。您可以选择同意或拒绝退回积分。
            </DialogDescription>
          </DialogHeader>

          {fetchingDispute ? (
            <div className="py-8 flex justify-center">
              <Spinner className="size-6" />
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {disputeInfo && (
                <div className="rounded-md bg-muted/40 p-3 text-sm">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground text-xs">
                    <span>发起争议理由</span>
                    <span>•</span>
                    <span>{formatDateTime(disputeInfo.created_at)}</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">
                    {disputeInfo.reason}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className={`h-auto py-2 flex flex-col gap-1 hover:bg-transparent hover:border-primary ${ action === 'refund' && 'border-primary text-primary' }`}
                  onClick={() => setAction('refund')}
                >
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    <span className="font-semibold">同意积分退回</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-normal">积分全额退回，争议结束</span>
                </Button>

                <Button
                  variant="outline"
                  className={`h-auto py-2 flex flex-col gap-1 hover:bg-transparent hover:border-destructive ${ action === 'closed' && 'border-destructive text-destructive' }`}
                  onClick={() => setAction('closed')}
                >
                  <div className="flex items-center gap-2">
                    <TicketSlash className="h-4 w-4" />
                    <span className="font-semibold">拒绝积分退回</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-normal">拒绝积分退回，此积分活动正常进行</span>
                </Button>
              </div>

              {action === 'closed' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 pt-2">
                  <Label htmlFor="reject-reason" className="text-xs font-medium">
                    拒绝原因 <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="reject-reason"
                    placeholder="请说明拒绝退回的原因..."
                    maxLength={100}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={loading}
                    className="h-9 text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground text-right">
                    {reason.length}/100
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={loading} className="h-8 text-xs">
                取消
              </Button>
            </DialogClose>
            <Button
              onClick={(e) => { e.preventDefault(); handleSubmit() }}
              disabled={loading || !action}
              className="bg-primary h-8 text-xs"
            >
              {loading ? <><Spinner /> 提交中</> : '确认处理'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
