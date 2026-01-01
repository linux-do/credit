import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { typeConfig, statusConfig } from "@/components/common/general/table-filter"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { ErrorInline } from "@/components/layout/error"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { EmptyStateWithBorder } from "@/components/layout/empty"
import { LoadingStateWithBorder } from "@/components/layout/loading"
import { ListRestart, Layers, LucideIcon } from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import type { Order } from "@/lib/services"
import {
  OrderDetailDialog,
  CreateDisputeDialog,
  CancelDisputeDialog,
  ViewDisputeHistoryDialog,
  RefundReviewDialog,
} from "./dispute-dialog"

const ROW_HEIGHT = 36

/**
 * 虚拟化交易数据表格组件
 * 使用 @tanstack/react-virtual 实现大数据量高性能渲染
 */
export const TransactionDataTable = React.memo(function TransactionDataTable({
  transactions
}: {
  transactions: Order[]
}) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => {
      if (!scrollAreaRef.current) return null
      const viewport = scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]')
      return viewport as Element
    },
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0
  const paddingBottom = virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0

  return (
    <div className="border border-dashed shadow-none rounded-lg overflow-hidden">
      <ScrollArea
        ref={scrollAreaRef}
        className="w-full h-[600px] whitespace-nowrap"
      >
        <table className="w-full caption-bottom text-sm min-w-full">
          <TableHeader className="sticky top-0 z-30 bg-background">
            <TableRow className="border-b border-dashed hover:bg-transparent">
              <TableHead className="whitespace-nowrap w-[120px]">名称</TableHead>
              <TableHead className="whitespace-nowrap text-center min-w-[60px]">积分</TableHead>
              <TableHead className="whitespace-nowrap text-center min-w-[50px]">类型</TableHead>
              <TableHead className="whitespace-nowrap text-center min-w-[50px]">状态</TableHead>
              <TableHead className="whitespace-nowrap text-center min-w-[80px]">积分动向</TableHead>
              <TableHead className="whitespace-nowrap text-center min-w-[80px]">应用名</TableHead>
              <TableHead className="whitespace-nowrap text-left min-w-[120px]">编号</TableHead>
              <TableHead className="whitespace-nowrap text-left min-w-[120px]">业务单号</TableHead>
              <TableHead className="whitespace-nowrap text-left w-[120px]">创建时间</TableHead>
              <TableHead className="whitespace-nowrap text-left w-[120px]">交易时间</TableHead>
              <TableHead className="whitespace-nowrap text-left w-[120px]">订单过期时间</TableHead>
              <TableHead className="whitespace-nowrap text-left min-w-[100px]">备注</TableHead>
              <TableHead className="sticky right-0 whitespace-nowrap text-center bg-background shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)] w-[150px] z-40">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            key={transactions[0]?.id}
            className="animate-in fade-in duration-200 [will-change:transform,opacity]"
          >
            {paddingTop > 0 && (
              <tr style={{ height: `${ paddingTop }px` }}>
                <td colSpan={13} />
              </tr>
            )}
            {virtualItems.map((virtualRow) => {
              const order = transactions[virtualRow.index]
              return (
                <TransactionTableRow
                  key={order.id}
                  order={order}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                />
              )
            })}
            {paddingBottom > 0 && (
              <tr style={{ height: `${ paddingBottom }px` }}>
                <td colSpan={13} />
              </tr>
            )}
          </TableBody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
})

/**
 * 交易表格行组件
 */
const TransactionTableRow = React.memo(React.forwardRef<HTMLTableRowElement, {
  order: Order
  style?: React.CSSProperties
} & React.HTMLAttributes<HTMLTableRowElement>>(function TransactionTableRow({
  order,
  style,
  ...props
}, ref) {
  const getAmountDisplay = (amount: string) => (
    <span className="text-xs font-semibold">
      {parseFloat(amount).toFixed(2)}
    </span>
  )

  const isDisputing = order.type === 'receive' && order.status === 'disputing'

  return (
    <TableRow
      ref={ref}
      style={style}
      {...props}
      className={`
        border-dashed group hover:bg-muted/50 data-[state=selected]:bg-muted
        ${ isDisputing ? 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30' : '' }
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
          className={`text-[10px] px-1 ${ typeConfig[order.type].color }`}
        >
          {typeConfig[order.type].label}
        </Badge>
      </TableCell>
      <TableCell className="text-[11px] font-medium whitespace-nowrap text-center py-1">
        <Badge
          variant="secondary"
          className={`text-[10px] px-1 ${ statusConfig[order.status].color }`}
        >
          {statusConfig[order.status].label}
        </Badge>
      </TableCell>
      <TableCell className="text-[11px] font-medium whitespace-nowrap text-center py-1">
        {order.status === 'pending' || order.status === 'expired' || order.type === 'community' ? (
          <div className="text-muted-foreground">-</div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center cursor-pointer gap-1 justify-center">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={order.payer_avatar_url || undefined} />
                    <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                      {order.payer_username.substring(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs font-bold">⭢</div>
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={order.payee_avatar_url || undefined} />
                    <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                      {order.payee_username.substring(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="p-3">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-semibold">消费方</p>
                    <p className="text-xs">ID: {order.payer_user_id}</p>
                    <p className="text-xs">账户: {order.payer_username}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold">服务方</p>
                    <p className="text-xs">ID: {order.payee_user_id}</p>
                    <p className="text-xs">账户: {order.payee_username}</p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
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
      <TableCell className="text-[11px] font-medium text-left py-1 max-w-[250px] truncate" title={order.remark || ''}>
        {order.remark || '-'}
      </TableCell>
      <TableCell className={`
        sticky right-0 whitespace-nowrap text-center shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)] py-1 z-20
        bg-background
        after:absolute after:inset-0 after:z-[-1] after:content-[''] after:pointer-events-none after:transition-colors
        ${ isDisputing
          ? 'after:bg-yellow-50 dark:after:bg-yellow-900/20 group-hover:after:bg-yellow-100/50 dark:group-hover:after:bg-yellow-900/30'
          : 'group-hover:after:bg-muted/50' }
      `}>
        <OrderDetailDialog order={order} />

        {/* 场景1：付款方对成功的订单发起争议 (支持 payment 和 online 类型) */}
        {(order.type === 'payment' || order.type === 'online') && order.status === 'success' && (
          <CreateDisputeDialog order={order} />
        )}

        {/* 场景2：付款方取消正在进行的争议 (支持 payment 和 online 类型) */}
        {(order.type === 'payment' || order.type === 'online') && order.status === 'disputing' && (
          <CancelDisputeDialog order={order} />
        )}

        {/* 场景3：付款方查看被拒绝的争议记录 (支持 payment 和 online 类型) */}
        {(order.type === 'payment' || order.type === 'online') && order.status === 'refused' && (
          <ViewDisputeHistoryDialog order={order} />
        )}

        {/* 场景4：收款方（商户）处理争议 */}
        {order.type === 'receive' && order.status === 'disputing' && (
          <RefundReviewDialog order={order} />
        )}
      </TableCell>
    </TableRow>
  )
}))

interface TransactionTableListProps {
  loading: boolean
  error: Error | null
  transactions: Order[]
  onRetry: () => void
  emptyIcon?: LucideIcon
  emptyDescription?: string
}

/**
 * 交易列表容器组件
 * 统一处理加载、错误、空状态
 */
export const TransactionTableList = React.memo(function TransactionTableList({
  loading,
  error,
  transactions,
  onRetry,
  emptyIcon = Layers,
  emptyDescription = "未发现积分活动"
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
    <TransactionDataTable transactions={transactions} />
  )
})

export { RefundReviewDialog, CancelDisputeDialog } from "./dispute-dialog"
