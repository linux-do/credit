import * as React from "react"
import { TransactionTableList } from "@/components/common/general/table-data"
import { TableFilter, type SearchValues } from "@/components/common/general/table-filter"
import { TransactionProvider, useTransaction } from "@/contexts/transaction-context"
import type { OrderStatus, OrderType, TransactionQueryParams } from "@/lib/services"
import { formatLocalDate } from "@/lib/utils"

/**
 * 获取默认日期范围（最近30天）
 */
function getDefaultDateRange() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const from = new Date(today)
  from.setDate(from.getDate() - 29)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return { from, to: tomorrow }
}

/**
 * 活动表格组件
 * 
 * 支持类型、状态、时间范围筛选的活动记录显示（支持分页）
 */
export function TradeTable({ type }: { type?: OrderType }) {
  /* 获取时间范围 */
  const { from, to: tomorrow } = getDefaultDateRange()
  const startTime = formatLocalDate(from)
  const endTime = formatLocalDate(tomorrow)

  return (
    <TransactionProvider defaultParams={{ page_size: 20, startTime, endTime }}>
      <TransactionList initialType={type} />
    </TransactionProvider>
  )
}

/**
 * 活动列表组件
 * 
 * 显示交用户活动记录
 */
function TransactionList({ initialType }: { initialType?: OrderType }) {
  const {
    transactions,
    total,
    currentPage,
    totalPages,
    pageSize,
    loading,
    error,
    fetchTransactions,
    goToPage,
    setPageSize: setPageSizeHandler,
    clearCacheAndRefresh,
  } = useTransaction()

  const [selectedTypes, setSelectedTypes] = React.useState<OrderType[]>(initialType ? [initialType] : [])
  const [selectedStatuses, setSelectedStatuses] = React.useState<OrderStatus[]>([])
  const [selectedQuickSelection, setSelectedQuickSelection] = React.useState<string | null>("最近 1 个月")
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date } | null>(getDefaultDateRange)
  const [selectedSearch, setSelectedSearch] = React.useState<SearchValues>({})

  /* 清空所有筛选 */
  const clearAllFilters = () => {
    setSelectedTypes(initialType ? [initialType] : [])
    setSelectedStatuses([])
    const { from, to: tomorrow } = getDefaultDateRange()
    setDateRange({ from, to: tomorrow })
    setSelectedQuickSelection("最近 1 个月")
    setSelectedSearch({})

    /* 重新获取数据 */
    fetchTransactions({
      page: 1,
      page_size: pageSize,
      type: initialType,
      startTime: formatLocalDate(from),
      endTime: formatLocalDate(tomorrow),
    })
  }

  /* 当筛选条件改变时，重新加载数据 */
  React.useEffect(() => {
    const params: TransactionQueryParams = {
      page: 1,
      page_size: pageSize,
      type: selectedTypes.length > 0 ? selectedTypes[0] : undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses[0] : undefined,
      startTime: dateRange ? formatLocalDate(dateRange.from) : undefined,
      endTime: dateRange ? (() => {
        const endDate = new Date(dateRange.to)
        endDate.setDate(endDate.getDate() + 1)
        return formatLocalDate(endDate)
      })() : undefined,
      id: selectedSearch.id || undefined,
      order_name: selectedSearch.order_name || undefined,
      payer_username: selectedSearch.payer_username || undefined,
      payee_username: selectedSearch.payee_username || undefined,
    }

    fetchTransactions(params)
  }, [fetchTransactions, dateRange, selectedTypes, selectedStatuses, selectedSearch, pageSize])

  /* 当initialType改变时，更新筛选状态 */
  React.useEffect(() => {
    if (initialType) {
      setSelectedTypes([initialType])
    } else {
      setSelectedTypes([])
    }
  }, [initialType])

  return (
    <div className="flex flex-col space-y-4">
      <TableFilter
        enabledFilters={{
          type: initialType === undefined,
          status: true,
          timeRange: true,
          search: true
        }}
        selectedTypes={selectedTypes}
        selectedStatuses={selectedStatuses}
        selectedTimeRange={dateRange}
        selectedQuickSelection={selectedQuickSelection}
        onTypeChange={setSelectedTypes}
        onStatusChange={setSelectedStatuses}
        onTimeRangeChange={setDateRange}
        onQuickSelectionChange={setSelectedQuickSelection}
        onSearch={setSelectedSearch}
        searchValues={selectedSearch}
        onClearAll={clearAllFilters}
        enablePagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        total={total}
        onPageChange={goToPage}
        onPageSizeChange={setPageSizeHandler}
        onRefresh={clearCacheAndRefresh}
        loading={loading}
      />

      <TransactionTableList
        loading={loading}
        error={error}
        transactions={transactions}
        onRetry={() => fetchTransactions({ page: 1 })}
      />
    </div>
  )
}
