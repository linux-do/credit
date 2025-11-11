"use client"

import * as React from "react"
import { useEffect } from "react"
import { ListRestart, Filter, CalendarIcon, X, Layers } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { zhCN } from "date-fns/locale"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTransaction } from "@/contexts/transaction-context"

/**
 * 交易表格组件
 * 支持类型、状态、时间范围筛选的交易记录显示（支持分页）
 * 注意：此组件必须在 TransactionProvider 内部使用
 */
export function TradeTable({ type }: { type?: OrderType }) {
  return <TransactionList initialType={type} />
}

// 类型标签配置
const typeConfig: Record<OrderType, { label: string; color: string }> = {
  receive: { label: '收款', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  payment: { label: '付款', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  transfer: { label: '转账', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  community: { label: '社区划转', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' }
}

// 状态标签配置
const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  success: { label: '成功', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  pending: { label: '处理中', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  failed: { label: '失败', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  disputing: { label: '争议中', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  refund: { label: '已退款', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
  refunding: { label: '退款中', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' }
}

/**
 * 可复用的筛选组件
 */
function FilterSelect<T extends string>({
  label,
  selectedValues,
  options,
  onToggleValue
}: {
  label: string
  selectedValues: T[]
  options: Record<T, { label: string; color: string }>
  onToggleValue: (value: T) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`!h-6 !min-h-6 text-xs font-bold rounded-full border shadow-none !px-2.5 !py-1 gap-2 inline-flex items-center w-auto hover:bg-accent ${
          selectedValues.length > 0
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-muted-foreground/20'
        }`}>
          <Filter className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground text-xs font-bold">{label}</span>
          {selectedValues.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-2.5" />
              <span className="text-blue-600 text-xs font-bold">{selectedValues.length}</span>
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-36" align="start">
        {(Object.keys(options) as T[]).map((value) => (
          <DropdownMenuItem
            key={value}
            className="flex items-center gap-2 px-2"
            onClick={() => onToggleValue(value)}
          >
            <Checkbox 
              checked={selectedValues.includes(value)}
              onChange={() => onToggleValue(value)}
              className="w-3 h-3 rounded-full"
            />
            <Badge
              variant="secondary"
              className={`text-[11px] px-1 ${options[value].color}`}
            >
              {options[value].label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * 交易列表组件
 */
function TransactionList({ initialType }: { initialType?: OrderType }) {
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

  // 筛选状态
  const [selectedTypes, setSelectedTypes] = React.useState<OrderType[]>(initialType ? [initialType] : [])
  const [selectedStatuses, setSelectedStatuses] = React.useState<OrderStatus[]>([])

  // 计算最近7天
  const getLastDays = (days: number) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    return { from, to }
  }

  // 跟踪当前选择的预设时间范围
  const [selectedQuickSelection, setSelectedQuickSelection] = React.useState<string | null>("最近 4 周")

  const [dateRange, setDateRange] = React.useState<{
    from: Date
    to: Date
  }>(getLastDays(28))

  const quickSelections = [
    { label: "今天", getValue: () => {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      tomorrow.setMilliseconds(-1) // 设置为当天的最后一毫秒
      return { from: today, to: tomorrow }
    }},
    { label: "最近 7 天", getValue: () => getLastDays(7) },
    { label: "最近 4 周", getValue: () => getLastDays(28) },
    { label: "最近 6 个月", getValue: () => {
      const to = new Date()
      const from = new Date()
      from.setMonth(from.getMonth() - 6)
      return { from, to }
    }},
    { label: "本月至今", getValue: () => {
      const to = new Date()
      const from = new Date(to.getFullYear(), to.getMonth(), 1)
      return { from, to }
    }},
    { label: "所有时间", getValue: () => {
      const to = new Date()
      const from = new Date(2020, 0, 1)
      return { from, to }
    }},
  ]

  // 切换类型筛选
  const toggleType = (type: OrderType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  // 切换状态筛选
  const toggleStatus = (status: OrderStatus) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  // 清空所有筛选
  const clearAllFilters = () => {
    setSelectedTypes(initialType ? [initialType] : [])
    setSelectedStatuses([])
    setDateRange(getLastDays(28))
    setSelectedQuickSelection("最近 4 周")
    // 重新获取数据
    const startTime = getLastDays(28).from.toISOString()
    const endTime = getLastDays(28).to.toISOString()
    fetchTransactions({
      page: 1,
      type: initialType,
      startTime,
      endTime,
    })
  }

  // 当筛选条件改变时，重新加载数据
  useEffect(() => {
    const startTime = dateRange.from.toISOString()
    const endTime = dateRange.to.toISOString()

    fetchTransactions({
      page: 1,
      type: selectedTypes.length > 0 ? selectedTypes[0] : undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses[0] : undefined,
      startTime,
      endTime,
    })
  }, [fetchTransactions, dateRange, selectedTypes, selectedStatuses])

  // 当initialType改变时，更新筛选状态
  useEffect(() => {
    if (initialType) {
      setSelectedTypes([initialType])
    } else {
      setSelectedTypes([])
    }
  }, [initialType])


  const filteredTransactions = transactions

  // 加载更多
  const handleLoadMore = () => {
    loadMore()
  }

  const hasActiveFilters = selectedTypes.length > 0 || selectedStatuses.length > 0

  return (
    <div className="flex flex-col space-y-2 mt-2">
      <div className="font-semibold pb-2">交易记录</div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {initialType === undefined && (
            <FilterSelect<OrderType>
              label="类型"
              selectedValues={selectedTypes}
              options={typeConfig}
              onToggleValue={toggleType}
            />
          )}

          <FilterSelect<OrderStatus>
            label="状态"
            selectedValues={selectedStatuses}
            options={statusConfig}
            onToggleValue={toggleStatus}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="!h-6 !min-h-6 text-xs font-bold rounded-full border border-muted-foreground/20 shadow-none !px-2.5 !py-1 gap-2 inline-flex items-center w-auto hover:bg-accent">
                <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground text-xs font-bold">时间区间</span>
                {selectedQuickSelection && (
                  <>
                    <Separator orientation="vertical" className="h-2.5" />
                    <span className="text-blue-600 text-xs font-bold">{selectedQuickSelection}</span>
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-90 md:w-160" align="start" sideOffset={4}>
              <div className="flex">
                <div className="w-32 px-1 py-4">
                  {quickSelections.map((selection) => (
                    <button
                      key={selection.label}
                      onClick={() => {
                        const range = selection.getValue()
                        setDateRange(range)
                        setSelectedQuickSelection(selection.label)
                      }}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors cursor-pointer ${
                        selectedQuickSelection === selection.label ? 'bg-accent text-accent-foreground' : ''
                      }`}
                    >
                      {selection.label}
                    </button>
                  ))}
                </div>

                <div className="px-1">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from) {
                        let to = range.to || range.from
                        if (!range.to || range.from.getTime() === to.getTime()) {
                          to = new Date(range.from)
                          to.setHours(23, 59, 59, 999)
                        }
                        setDateRange({ from: range.from, to })
                        setSelectedQuickSelection(null)
                      }
                    }}
                    numberOfMonths={2}
                    locale={zhCN}
                  />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 px-2.5 text-xs font-bold rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 gap-1 self-start sm:self-auto"
          >
            <X className="h-3 w-3" />
            清空筛选
          </Button>
        )}
      </div>

      {loading && transactions.length === 0 && (
        <EmptyStateWithBorder
          icon={ListRestart}
          description="数据加载中"
          loading={true}
        />
      )}

      {error && (
        <div className="p-8 border-2 border-dashed border-border rounded-lg">
          <ErrorInline
            error={error}
            onRetry={() => fetchTransactions({ page: 1 })}
            className="justify-center"
          />
        </div>
      )}

      {!loading && !error && (
        <>
          {!transactions || transactions.length === 0 ? (
            <EmptyStateWithBorder
              icon={Layers}
              description="未发现活动"
            />
          ) : filteredTransactions.length === 0 ? (
            <EmptyStateWithBorder
              icon={Layers}
              description="暂无符合条件的交易记录"
            />
          ) : (
            <>
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
                      {filteredTransactions.map((order) => (
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
                  {loading ? '加载中...' : `加载更多 (${filteredTransactions.length}/${total})`}
                </Button>
              )}

              {currentPage >= totalPages && total > 0 && (
                <div className="pt-2 text-center text-xs text-muted-foreground">
                  已加载全部 {total} 条记录
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

/**
 * 交易表格行组件
 */
function TransactionTableRow({ order }: { order: Order }) {
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
        timeZone: 'Asia/Shanghai',
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

