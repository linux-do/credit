"use client"

import * as React from "react"
import { useEffect } from "react"
import { Layers, ListRestart } from "lucide-react"
import type { Order, OrderType, OrderStatus } from "@/lib/services"
import { Button } from "@/components/ui/button"
import { ErrorInline } from "@/components/common/status/error"
import { EmptyStateWithBorder } from "@/components/common/status/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TransactionProvider, useTransaction } from "@/contexts/transaction-context"

/**
 * 交易表格组件
 * 根据传入的type显示对应类型的交易记录（支持分页）
 */
export function TradeTable({ type }: { type?: OrderType }) {
  return (
    <TransactionProvider defaultParams={{ page_size: 20 }}>
      <div>
        <div className="font-semibold py-4">交易记录</div>
        <TransactionList type={type} />
      </div>
    </TransactionProvider>
  )
}

/**
 * 交易列表组件
 */
function TransactionList({ type }: { type?: OrderType }) {
  const {
    transactions,
    total,
    currentPage,
    totalPages,
    loading,
    error,
    fetchTransactions,
    loadMore,
  } = useTransaction()

  // 重新加载数据
  useEffect(() => {
    fetchTransactions({ 
      page: 1, 
      type,
    })
  }, [type, fetchTransactions])

  // 加载更多
  const handleLoadMore = () => {
    loadMore()
  }

  // 如果loading且没有数据，显示加载状态
  if (loading && transactions.length === 0) {
    return (
      <EmptyStateWithBorder
        icon={ListRestart}
        description="数据加载中"
        loading={true}
      />
    )
  }

  if (error) {
    return (
      <div className="p-8 border-2 border-dashed border-border rounded-lg">
        <ErrorInline 
          error={error} 
          onRetry={() => fetchTransactions({ page: 1 })} 
          className="justify-center" 
        />
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <EmptyStateWithBorder
        icon={Layers}
        description="未发现活动"
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-muted rounded-lg overflow-hidden">
        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap w-[180px]">名称</TableHead>
                <TableHead className="whitespace-nowrap text-center w-[80px]">类型</TableHead>
                <TableHead className="whitespace-nowrap text-right w-[120px]">金额</TableHead>
                <TableHead className="whitespace-nowrap text-center w-[140px]">交易双方</TableHead>
                <TableHead className="whitespace-nowrap text-center w-[160px]">订单号</TableHead>
                <TableHead className="whitespace-nowrap text-center w-[160px]">商户订单号</TableHead>
                <TableHead className="whitespace-nowrap text-center w-[120px]">交易时间</TableHead>
                <TableHead className="whitespace-nowrap text-center w-[120px]">创建时间</TableHead>
                <TableHead className="whitespace-nowrap text-center w-[80px]">状态</TableHead>
                <TableHead className="sticky right-0 whitespace-nowrap text-center bg-muted shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)] w-[150px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="animate-in fade-in duration-200">
              {transactions.map((order) => (
                <TransactionTableRow key={order.order_no} order={order} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {currentPage < totalPages && (
        <Button
          variant="outline"
          onClick={handleLoadMore}
          disabled={loading}
          className="w-full"
        >
          {loading ? '加载中...' : `加载更多 (${transactions.length}/${total})`}
        </Button>
      )}

      {currentPage >= totalPages && total > 0 && (
        <div className="pt-2 text-center text-xs text-muted-foreground">
          已加载全部 {total} 条记录
        </div>
      )}
    </div>
  )
}

/**
 * 交易表格行组件
 */
function TransactionTableRow({ order }: { order: Order }) {
  const typeConfig: Record<OrderType, { label: string; color: string }> = {
    receive: { label: '收款', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    payment: { label: '付款', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    transfer: { label: '转账', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    community: { label: '社区划转', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' }
  }

  const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
    success: { label: '成功', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    pending: { label: '处理中', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    failed: { label: '失败', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    disputing: { label: '争议中', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
    refund: { label: '已退款', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
    refunding: { label: '退款中', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' }
  }

  const getAmountDisplay = (amount: string) => {
    return (
      <span className="text-xs font-semibold">
        {parseFloat(amount).toFixed(2)}
      </span>
    )
  }

  // 格式化时间
  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return timeStr
    }
  }

  return (
    <TableRow className="h-8">
      <TableCell className="text-xs font-medium whitespace-nowrap py-1">
        {order.order_name}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center py-1">
        <Badge
          variant="secondary"
          className={`text-[11px] px-1 ${typeConfig[order.type].color}`}
        >
          {typeConfig[order.type].label}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap text-right py-1">
        {getAmountDisplay(order.amount)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center py-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center cursor-pointer gap-1 justify-center">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                    {order.payer_username.substring(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-xs font-bold">⭢</div>
                <Avatar className="h-4 w-4">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                    {order.payee_username.substring(0, 1)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="p-3">
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold">付款方</p>
                  <p className="text-xs">账户: {order.payer_username}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold">收款方</p>
                  <p className="text-xs">账户: {order.payee_username}</p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="font-mono text-xs text-center py-1">
        {order.order_no}
      </TableCell>
      <TableCell className="font-mono text-xs text-center py-1">
        {order.merchant_order_no || '-'}
      </TableCell>
      <TableCell className="text-xs text-center py-1">
        {formatTime(order.trade_time)}
      </TableCell>
      <TableCell className="text-xs text-center py-1">
        {formatTime(order.created_at)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center py-1">
        <Badge
          variant="secondary"
          className={`text-[11px] px-1 ${statusConfig[order.status].color}`}
        >
          {statusConfig[order.status].label}
        </Badge>
      </TableCell>
      <TableCell className="sticky right-0 whitespace-nowrap text-center bg-muted shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)] py-1">
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          详情
        </Button>
      </TableCell>
    </TableRow>
  )
}

