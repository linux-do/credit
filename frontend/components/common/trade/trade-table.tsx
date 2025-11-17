import * as React from "react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ErrorInline } from "@/components/layout/error"
import { EmptyStateWithBorder } from "@/components/layout/empty"
import { TableFilter } from "@/components/common/general/table-filter"
import { TransactionDataTable } from "@/components/common/general/table-data"
import { ListRestart, Layers } from "lucide-react"

import type { OrderType, OrderStatus, TransactionQueryParams } from "@/lib/services"
import { TransactionProvider, useTransaction } from "@/contexts/transaction-context"


/**
 * 交易表格组件
 * 支持类型、状态、时间范围筛选的交易记录显示（支持分页）
 * 
 * @example
 * ```tsx
 * <TradeTable type="receive" />
 * ```
 */
export function TradeTable({ type }: { type?: OrderType }) {
  /* 计算最近一个月的时间范围 */
  const getLastMonthRange = () => {
    const now = new Date()
    const endTime = now.toISOString()
    const startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    return { startTime, endTime }
  }

  /* 获取时间范围 */
  const { startTime, endTime } = getLastMonthRange()

  return (
    <TransactionProvider defaultParams={{ page_size: 20, startTime, endTime }}>
      <TransactionList initialType={type} />
    </TransactionProvider>
  )
}


/**
 * 交易列表组件
 * 显示交易记录
 * 
 * @example
 * ```tsx
 * <TransactionList initialType="receive" />
 * ```
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

  /* 筛选状态 */
  const [selectedTypes, setSelectedTypes] = React.useState<OrderType[]>(initialType ? [initialType] : [])
  const [selectedStatuses, setSelectedStatuses] = React.useState<OrderStatus[]>([])
  const [selectedQuickSelection, setSelectedQuickSelection] = React.useState<string | null>("最近 1 个月")
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date } | null>(() => {
    const now = new Date()
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    return { from, to: now }
  })

  /* 清空所有筛选 */
  const clearAllFilters = () => {
    setSelectedTypes(initialType ? [initialType] : [])
    setSelectedStatuses([])
    const now = new Date()
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    setDateRange({ from, to: now })
    setSelectedQuickSelection("最近 1 个月")
    /* 重新获取数据 */
    fetchTransactions({
      page: 1,
      page_size: 20,
      type: initialType,
      startTime: from.toISOString(),
      endTime: now.toISOString(),
    })
  }

  /* 当筛选条件改变时，重新加载数据 */
  useEffect(() => {
    const params: TransactionQueryParams = {
      page: 1,
      page_size: 20,
      type: selectedTypes.length > 0 ? selectedTypes[0] : undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses[0] : undefined,
      startTime: dateRange ? dateRange.from.toISOString() : undefined,
      endTime: dateRange ? dateRange.to.toISOString() : undefined,
    }

    fetchTransactions(params)
  }, [fetchTransactions, dateRange, selectedTypes, selectedStatuses])

  /* 当initialType改变时，更新筛选状态 */
  useEffect(() => {
    if (initialType) {
      setSelectedTypes([initialType])
    } else {
      setSelectedTypes([])
    }
  }, [initialType])

  /* 加载更多 */
  const handleLoadMore = () => {
    loadMore()
  }

  const renderContent = () => {
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
      <>
        <TransactionDataTable transactions={transactions} />

        {currentPage < totalPages && (
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
            className="w-full text-xs border-dashed"
          >
            {loading ? (<><Spinner /> 正在加载</>) : (`加载更多 (${transactions.length}/${total})`)}
          </Button>
        )}

        {currentPage >= totalPages && total > 0 && (
          <div className="pt-2 text-center text-xs text-muted-foreground">
            已加载全部 {total} 条记录
          </div>
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="space-y-2">
        <TableFilter
          enabledFilters={{
            type: initialType === undefined,
            status: true,
            timeRange: true
          }}
          selectedTypes={selectedTypes}
          selectedStatuses={selectedStatuses}
          selectedTimeRange={dateRange}
          selectedQuickSelection={selectedQuickSelection}
          onTypeChange={setSelectedTypes}
          onStatusChange={setSelectedStatuses}
          onTimeRangeChange={setDateRange}
          onQuickSelectionChange={setSelectedQuickSelection}
          onClearAll={clearAllFilters}
        />

        {renderContent()}
      </div>
    </div>
  )
}
