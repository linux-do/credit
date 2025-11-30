import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { typeConfig, statusConfig } from "@/components/common/general/table-filter"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { ErrorInline } from "@/components/layout/error"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { EmptyStateWithBorder } from "@/components/layout/empty"
import { LoadingStateWithBorder } from "@/components/layout/loading"
import { ListRestart, Layers, LucideIcon, Banknote, X, AlertTriangle, TicketSlash } from "lucide-react"
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
import { TransactionService, DisputeService } from "@/lib/services"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"
import { usePublicConfig } from "@/hooks/use-public-config"
import { useTransaction } from "@/contexts/transaction-context"
import { useUser } from "@/contexts/user-context"
import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"


/**
 * 交易数据表格组件
 * 显示交易记录的表格，可复用于不同页面
 */
export function TransactionDataTable({ transactions }: { transactions: Order[] }) {
  return (
    <div className="border border-dashed shadow-none rounded-lg overflow-hidden">
      <ScrollArea className="w-full">
        <div className="relative w-full">
          <table className="w-full caption-bottom text-sm">
            <TableHeader>
              <TableRow className="border-b border-dashed">
                <TableHead className="whitespace-nowrap w-[120px]">名称</TableHead>
                <TableHead className="whitespace-nowrap text-center min-w-[60px]">金额</TableHead>
                <TableHead className="whitespace-nowrap text-center min-w-[50px]">类型</TableHead>
                <TableHead className="whitespace-nowrap text-center min-w-[50px]">状态</TableHead>
                <TableHead className="whitespace-nowrap text-center min-w-[80px]">资金流</TableHead>
                <TableHead className="whitespace-nowrap text-center min-w-[80px]">商户名</TableHead>
                <TableHead className="whitespace-nowrap text-left min-w-[120px]">订单号</TableHead>
                <TableHead className="whitespace-nowrap text-left min-w-[120px]">商户订单号</TableHead>
                <TableHead className="whitespace-nowrap text-left w-[120px]">创建时间</TableHead>
                <TableHead className="whitespace-nowrap text-left w-[120px]">交易时间</TableHead>
                <TableHead className="whitespace-nowrap text-left w-[120px]">订单过期时间</TableHead>
                <TableHead className="sticky right-0 whitespace-nowrap text-center bg-background shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)] w-[150px] z-10">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="animate-in fade-in duration-200">
              {transactions.map((order) => (
                <TransactionTableRow
                  key={order.order_no}
                  order={order}
                />
              ))}
            </TableBody>
          </table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

/**
 * 交易表格行组件
 * 展示交易记录的表格行
 */
function OrderDetailDialog({ order }: { order: Order }) {
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
        <DialogContent showCloseButton={false} className="max-w-sm p-0 overflow-hidden bg-transparent border-0 shadow-none sm:max-w-[380px]">
          <DialogHeader className="sr-only">
            <DialogTitle>交易详情</DialogTitle>
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
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Amount</p>
                <div className="text-4xl font-black tracking-tighter flex items-start justify-center gap-1">
                  {parseFloat(order.amount).toFixed(2)}
                </div>
              </div>

              <div className="space-y-0 text-sm border-y-2 border-dashed border-border/50 py-4">
                <div className="flex justify-between items-center py-2 border-b border-dashed border-border/30 last:border-0">
                  <span className="text-muted-foreground text-xs uppercase font-medium">订单号</span>
                  <span className="font-mono text-xs font-medium">{order.order_no}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-dashed border-border/30 last:border-0">
                  <span className="text-muted-foreground text-xs uppercase font-medium">类型</span>
                  <span className="text-xs font-medium">{typeConfig[order.type]?.label || order.type}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-dashed border-border/30 last:border-0">
                  <span className="text-muted-foreground text-xs uppercase font-medium">付款方</span>
                  <span className="text-xs font-medium">{order.payer_username}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-dashed border-border/30 last:border-0">
                  <span className="text-muted-foreground text-xs uppercase font-medium">收款方</span>
                  <span className="text-xs font-medium">{order.payee_username}</span>
                </div>
                {(order.status === 'success' || order.status === 'refund') && (
                  <div className="flex justify-between items-center py-2 border-b border-dashed border-border/30 last:border-0">
                    <span className="text-muted-foreground text-xs uppercase font-medium">交易时间</span>
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
                      style={{ height: `${Math.max(40, Math.random() * 100)}%` }}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono tracking-wider text-center">
                  LINUX DO PAY
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
 * 发起争议弹窗组件
 * 场景1：付款方对成功的订单发起争议
 */
function CreateDisputeDialog({ order, onSuccess }: { order: Order; onSuccess?: () => void }) {
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
    /* 如果配置正在加载，等待配置加载完成*/
    if (configLoading) {
      try {
        await new Promise(resolve => setTimeout(resolve, 100))
        if (configLoading) {
          toast.error('配置加载中', {
            description: '请稍候再试'
          })
          return
        }
      } catch {
        toast.error('配置加载失败', {
          description: '请刷新页面重试'
        })
        return
      }
    }

    if (configError || !publicConfig) {
      toast.error('无法获取配置', {
        description: configError?.message || '请刷新页面重试'
      })
      return
    }

    /* 检查时间窗口*/
    const tradeTime = new Date(order.trade_time)
    const expiryTime = new Date(tradeTime.getTime() + publicConfig.dispute_time_window_hours * 60 * 60 * 1000)
    const now = new Date()

    if (now > expiryTime) {
      toast.error('无法发起争议', {
        description: '此订单已超过最晚发起争议时间'
      })
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
      toast.error('表单验证失败', {
        description: '请填写争议原因'
      })
      return
    }

    if (reason.length > 100) {
      toast.error('表单验证失败', {
        description: '争议原因不能超过 100 个字符'
      })
      return
    }

    try {
      setLoading(true)

      await TransactionService.createDispute({
        order_id: order.id,
        reason: reason.trim(),
      })

      toast.success('争议已发起', {
        description: '请等待商家处理'
      })

      /* 乐观更新：发起争议后，状态变为 disputing*/
      updateOrderStatus(order.id, { status: 'disputing' })

      setOpen(false)
      resetForm()
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '发起争议失败'
      toast.error('发起争议失败', {
        description: errorMessage
      })
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
        <DialogContent className={isMobile ? "max-w-[95vw] p-4" : "max-w-md"}>
          <DialogHeader>
            <DialogTitle className={isMobile ? "text-base" : ""}>发起争议</DialogTitle>
            <DialogDescription className={isMobile ? "text-xs" : ""}>
              如果您对订单有疑问，可以发起争议。商家将在规定时间内处理。
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

          <DialogFooter className={isMobile ? "flex-col gap-2 sm:flex-row" : ""}>
            <DialogClose asChild>
              <Button
                variant="ghost"
                disabled={loading}
                className={isMobile ? "w-full h-9 text-sm" : "h-8 text-xs"}
              >
                取消
              </Button>
            </DialogClose>
            <Button
              onClick={(e) => {
                e.preventDefault()
                handleCreateDispute()
              }}
              disabled={loading}
              className={isMobile ? "w-full bg-indigo-500 h-9 text-sm" : "bg-indigo-500 h-8 text-xs"}
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
 * 取消争议弹窗组件
 * 场景2：付款方在争议进行中取消争议
 */
function CancelDisputeDialog({ order, onSuccess }: { order: Order; onSuccess?: () => void }) {
  const isMobile = useIsMobile()
  const { updateOrderStatus } = useTransaction()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCancelDispute = async () => {
    try {
      setLoading(true)

      /* 检查订单是否有争议ID */
      if (!order.dispute_id) {
        toast.error('取消争议失败', {
          description: '未找到争议记录'
        })
        return
      }

      await DisputeService.closeDispute({
        dispute_id: order.dispute_id,
      })

      toast.success('争议已取消', {
        description: '争议已成功取消'
      })

      /* 乐观更新：取消争议后，状态恢复为 success */
      updateOrderStatus(order.id, { status: 'success' })

      setOpen(false)
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '取消争议失败'
      toast.error('取消争议失败', {
        description: errorMessage
      })
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
        <DialogContent className={isMobile ? "max-w-[95vw] p-4" : "max-w-md"}>
          <DialogHeader>
            <DialogTitle className={isMobile ? "text-base" : ""}>取消争议</DialogTitle>
            <DialogDescription className={isMobile ? "text-xs" : ""}>
              您确定要取消当前的争议申请吗？取消后交易将恢复正常。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className={isMobile ? "flex-col gap-2 sm:flex-row" : ""}>
            <DialogClose asChild>
              <Button
                variant="ghost"
                disabled={loading}
                className={isMobile ? "w-full h-9 text-sm" : "h-8 text-xs"}
              >
                取消
              </Button>
            </DialogClose>
            <Button
              onClick={(e) => {
                e.preventDefault()
                handleCancelDispute()
              }}
              disabled={loading}
              className={isMobile ? "w-full bg-indigo-500 h-9 text-sm" : "bg-indigo-500 h-8 text-xs"}
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
 * 查看争议历史弹窗组件
 * 场景3：付款方查看被拒绝的争议记录
 */
function ViewDisputeHistoryDialog({ order }: { order: Order }) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [disputeHistory, setDisputeHistory] = useState<Dispute | null>(null)
  const [fetchingHistory, setFetchingHistory] = useState(false)

  const resetForm = () => {
    setDisputeHistory(null)
  }

  const fetchDisputeHistory = async () => {
    try {
      setFetchingHistory(true)

      /* 检查订单是否有争议ID */
      if (!order.dispute_id) {
        toast.error('获取争议记录失败', {
          description: '未找到争议记录'
        })
        return
      }

      /* 作为发起者查询争议记录 */
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
      toast.error('获取争议记录失败', {
        description: errorMessage
      })
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

  /* 解析争议原因 */
  const parseDisputeReason = (fullReason: string) => {
    const match = fullReason.match(/^(.*?)\[商家拒绝理由: (.*?)\]$/)
    if (match) {
      return {
        userReason: match[1].trim(),
        merchantReason: match[2].trim()
      }
    }
    return {
      userReason: fullReason,
      merchantReason: null
    }
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
        <DialogContent className={isMobile ? "max-w-[95vw] p-4" : "max-w-md"}>
          <DialogHeader>
            <DialogTitle className={isMobile ? "text-base" : ""}>争议详情</DialogTitle>
            <DialogDescription className={isMobile ? "text-xs" : ""}>
              查看争议处理记录
            </DialogDescription>
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
                    <span className="text-sm font-medium">用户发起争议</span>
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
                    <span className="text-sm font-medium text-destructive">商家驳回争议</span>
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

          <DialogFooter className={isMobile ? "flex-col gap-2 sm:flex-row" : ""}>
            <DialogClose asChild>
              <Button
                variant="ghost"
                className={isMobile ? "w-full h-9 text-sm" : "h-8 text-xs"}
              >
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
 * 退款审核弹窗组件
 * 场景4：收款方（商户）处理争议，同意或拒绝退款
 */
function RefundReviewDialog({ order, onSuccess }: { order: Order; onSuccess?: () => void }) {
  const isMobile = useIsMobile()
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

      /* 检查订单是否有争议ID */
      if (!order.dispute_id) {
        toast.error('获取争议详情失败', {
          description: '未找到争议记录'
        })
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
        toast.error('获取争议详情失败', {
          description: '未找到争议记录'
        })
      }
    } catch (error) {
      console.error('获取争议详情失败:', error)
      const errorMessage = error instanceof Error ? error.message : '获取争议详情失败'
      toast.error('获取争议详情失败', {
        description: errorMessage
      })
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
      toast.error('拒绝原因不能超过 100 个字符')
      return
    }

    try {
      setLoading(true)

      /* 检查订单是否有争议ID */
      if (!order.dispute_id) {
        toast.error('处理失败', {
          description: '未找到争议记录'
        })
        return
      }

      await DisputeService.refundReview({
        dispute_id: order.dispute_id,
        status: action,
        reason: action === 'closed' ? reason.trim() : undefined,
      })

      toast.success('处理成功', {
        description: action === 'refund' ? '已同意退款，争议结束' : '已拒绝退款，交易继续'
      })

      updateOrderStatus(order.id, {
        status: action === 'refund' ? 'refund' : 'success'
      })

      setOpen(false)
      resetForm()
      refetchUser()
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '处理失败'
      toast.error('处理失败', {
        description: errorMessage
      })
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
        <DialogContent className={isMobile ? "max-w-[95vw] p-4" : "max-w-2xl"}>
          <DialogHeader>
            <DialogTitle className={isMobile ? "text-base" : ""}>处理争议</DialogTitle>
            <DialogDescription className={isMobile ? "text-xs" : ""}>
              请审核此争议申请。您可以同意退款或拒绝退款。
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
                  className={`h-auto py-2 flex flex-col gap-1 hover:bg-transparent hover:border-primary ${action === 'refund' && 'border-primary text-primary'}`}
                  onClick={() => setAction('refund')}
                >
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    <span className="font-semibold">同意退款</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-normal">全额退款，争议结束</span>
                </Button>

                <Button
                  variant="outline"
                  className={`h-auto py-2 flex flex-col gap-1 hover:bg-transparent hover:border-destructive ${action === 'closed' && 'border-destructive text-destructive'}`}
                  onClick={() => setAction('closed')}
                >
                  <div className="flex items-center gap-2">
                    <TicketSlash className="h-4 w-4" />
                    <span className="font-semibold">拒绝退款</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-normal">拒绝申请，交易继续</span>
                </Button>
              </div>

              {action === 'closed' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 pt-2">
                  <Label htmlFor="reject-reason" className="text-xs font-medium">
                    拒绝原因 <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="reject-reason"
                    placeholder="请说明拒绝退款的原因..."
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

          <DialogFooter className={isMobile ? "flex-col gap-2 sm:flex-row" : ""}>
            <DialogClose asChild>
              <Button
                variant="ghost"
                disabled={loading}
                className={isMobile ? "w-full h-9 text-sm" : "h-8 text-xs"}
              >
                取消
              </Button>
            </DialogClose>
            <Button
              onClick={(e) => {
                e.preventDefault()
                handleSubmit()
              }}
              disabled={loading || !action}
              className={isMobile ? "w-full bg-indigo-500 h-9 text-sm" : "bg-indigo-500 h-8 text-xs"}
            >
              {loading ? <><Spinner /> 提交中</> : '确认处理'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * 交易表格行组件
 * 展示交易记录的表格行
 */
function TransactionTableRow({ order }: { order: Order }) {
  /* 格式化金额 */
  const getAmountDisplay = (amount: string) => (
    <span className="text-xs font-semibold">
      {parseFloat(amount).toFixed(2)}
    </span>
  )

  return (
    <TableRow
      key={order.id}
      className={`
        group hover:bg-muted/50 data-[state=selected]:bg-muted
        ${order.type === 'receive' && order.status === 'disputing' ? 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30' : ''}
      `}
    >
      <TableCell className="text-[11px] font-medium whitespace-nowrap py-1">
        {order.order_name}
      </TableCell>
      <TableCell className="text-[11px] font-medium whitespace-nowrap text-center py-1">
        {getAmountDisplay(order.amount)}
      </TableCell>
      <TableCell className="text-[11px] font-medium whitespace-nowrap text-center py-1">
        <Badge
          variant="secondary"
          className={`text-[10px] px-1 ${typeConfig[order.type].color}`}
        >
          {typeConfig[order.type].label}
        </Badge>
      </TableCell>
      <TableCell className="text-[11px] font-medium whitespace-nowrap text-center py-1">
        <Badge
          variant="secondary"
          className={`text-[10px] px-1 ${statusConfig[order.status].color}`}
        >
          {statusConfig[order.status].label}
        </Badge>
      </TableCell>
      <TableCell className="text-[11px] font-medium whitespace-nowrap text-center py-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center cursor-pointer gap-1 justify-center">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                    {order.payer_username.substring(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-xs font-bold">⭢</div>
                <Avatar className="h-4 w-4">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                    {order.payee_username.substring(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="p-3">
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold">付款方</p>
                  <p className="text-xs">ID: {order.payer_user_id}</p>
                  <p className="text-xs">账户: {order.payer_username}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold">收款方</p>
                  <p className="text-xs">ID: {order.payee_user_id}</p>
                  <p className="text-xs">账户: {order.payee_username}</p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="text-[11px] font-medium text-center py-1">
        {order.app_name || '-'}
      </TableCell>
      <TableCell className="font-mono text-[11px] font-medium text-left py-1">
        {order.order_no}
      </TableCell>
      <TableCell className="font-mono text-[11px] font-medium text-left py-1">
        {order.merchant_order_no || '-'}
      </TableCell>
      <TableCell className="text-[11px] font-medium text-left py-1">
        {formatDateTime(order.created_at)}
      </TableCell>
      <TableCell className="text-[11px] font-medium text-left py-1">
        {(order.status === 'success' || order.status === 'refund') ? formatDateTime(order.trade_time) : '-'}
      </TableCell>
      <TableCell className="text-[11px] font-medium text-left py-1">
        {formatDateTime(order.expires_at)}
      </TableCell>
      <TableCell className="sticky right-0 whitespace-nowrap text-center bg-background shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)] py-1 z-10">
        <OrderDetailDialog order={order} />

        {/* 场景1：付款方对成功的订单发起争议 */}
        {order.type === 'payment' && order.status === 'success' && (
          <CreateDisputeDialog order={order} />
        )}

        {/* 场景2：付款方取消正在进行的争议 */}
        {order.type === 'payment' && order.status === 'disputing' && (
          <CancelDisputeDialog order={order} />
        )}

        {/* 场景3：付款方查看被拒绝的争议记录 */}
        {order.type === 'payment' && order.status === 'refused' && (
          <ViewDisputeHistoryDialog order={order} />
        )}

        {/* 场景4：收款方（商户）处理争议 */}
        {order.type === 'receive' && order.status === 'disputing' && (
          <RefundReviewDialog order={order} />
        )}
      </TableCell>
    </TableRow>
  )
}

interface TransactionTableListProps {
  loading: boolean
  error: Error | null
  transactions: Order[]
  total: number
  currentPage: number
  totalPages: number
  onRetry: () => void
  onLoadMore: () => void
  emptyIcon?: LucideIcon
  emptyDescription?: string
}

/**
 * 交易列表容器组件
 * 统一处理加载、错误、空状态和分页加载
 */
export function TransactionTableList({
  loading,
  error,
  transactions,
  total,
  currentPage,
  totalPages,
  onRetry,
  onLoadMore,
  emptyIcon = Layers,
  emptyDescription = "未发现活动"
}: TransactionTableListProps) {
  if (loading && transactions.length === 0) {
    return (
      <LoadingStateWithBorder
        icon={ListRestart}
      />
    )
  }

  if (error) {
    return (
      <div className="p-8 border border-dashed rounded-lg">
        <ErrorInline
          error={error}
          onRetry={onRetry}
          className="justify-center"
        />
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <EmptyStateWithBorder
        icon={emptyIcon}
        description={emptyDescription}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <TransactionDataTable transactions={transactions} />

      {currentPage < totalPages && (
        <Button
          variant="outline"
          onClick={onLoadMore}
          disabled={loading}
          className="w-full text-xs border-dashed shadow-none"
        >
          {loading ? (<><Spinner className="size-4" />正在加载</>) : (`加载更多 (${transactions.length}/${total})`)}
        </Button>
      )}

    </div>
  )
}

// 导出对话框组件供其他组件使用
export { RefundReviewDialog, CancelDisputeDialog }
