"use client"

import * as React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Undo2, FileText, Link2 } from "lucide-react"
import { toast } from "sonner"
import { TableFilter, type SearchValues } from "@/components/common/general/table-filter"
import { TransactionTableList } from "@/components/common/general/table-data"
import type { MerchantAPIKey, OrderType, OrderStatus } from "@/lib/services"
import { TransactionProvider, useTransaction } from "@/contexts/transaction-context"

/** 集市功能列表 */
const MERCHANT_ACTIONS = [
  { title: "处理争议", description: "获取此应用的所有争议", icon: Undo2, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/20", action: "refund" as const },
  { title: "所有活动", description: "显示此应用的所有活动", icon: FileText, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/20", action: "view-all" as const },
  { title: "在线流转", description: "创建在线积分流转活动", icon: Link2, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/20", action: "online-payment" as const },
]

/** 格式化日期为本地时间字符串 */
const formatLocalDate = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${ y }-${ m }-${ d }T${ h }:${ min }:${ s }+08:00`
}

/** 获取默认日期范围（最近30天） */
const getDefaultDateRange = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const from = new Date(today)
  from.setDate(from.getDate() - 29)
  return { from, to: today }
}

interface MerchantDataProps {
  apiKey: MerchantAPIKey
}

/**
 * 集市数据组件
 * 显示应用的活动数据和统计信息
 */
export function MerchantData({ apiKey }: MerchantDataProps) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - 29)
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  end.setDate(end.getDate() + 1)

  return (
    <TransactionProvider
      defaultParams={{
        page_size: 20,
        startTime: formatLocalDate(start),
        endTime: formatLocalDate(end),
        client_id: apiKey.client_id
      }}
    >
      <MerchantDataContent apiKey={apiKey} />
    </TransactionProvider>
  )
}

/**
 * 集市数据内容组件
 */
function MerchantDataContent({ apiKey }: MerchantDataProps) {
  const router = useRouter()
  const { transactions, total, currentPage, totalPages, pageSize, loading, error, fetchTransactions, goToPage, setPageSize: setPageSizeHandler } = useTransaction()

  const [selectedTypes, setSelectedTypes] = React.useState<OrderType[]>([])
  const [selectedStatuses, setSelectedStatuses] = React.useState<OrderStatus[]>([])
  const [selectedQuickSelection, setSelectedQuickSelection] = React.useState<string | null>("最近 1 个月")
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date } | null>(getDefaultDateRange)
  const [selectedSearch, setSelectedSearch] = React.useState<SearchValues>({})

  const clearAllFilters = () => {
    setSelectedTypes([])
    setSelectedStatuses([])
    setDateRange(getDefaultDateRange())
    setSelectedQuickSelection("最近 1 个月")
    setSelectedSearch({})
  }

  useEffect(() => {
    const params = {
      page: 1,
      page_size: 20,
      type: selectedTypes[0] as OrderType | undefined,
      status: selectedStatuses[0] as OrderStatus | undefined,
      startTime: dateRange ? formatLocalDate(dateRange.from) : undefined,
      endTime: dateRange ? (() => {
        const endDate = new Date(dateRange.to)
        endDate.setDate(endDate.getDate() + 1)
        return formatLocalDate(endDate)
      })() : undefined,
      client_id: apiKey.client_id,
      id: selectedSearch.id || undefined,
      order_name: selectedSearch.order_name || undefined,
      payer_username: selectedSearch.payer_username || undefined,
      payee_username: selectedSearch.payee_username || undefined,
    }
    fetchTransactions(params)
  }, [fetchTransactions, dateRange, selectedTypes, selectedStatuses, apiKey.client_id, selectedSearch])

  const actionHandlers = {
    refund: () => {
      setSelectedStatuses(['disputing'])
      toast.success('待处理的争议', { description: '显示此应用的所有待处理的争议' })
    },
    'view-all': () => {
      clearAllFilters()
      toast.success('全部活动', { description: '显示此应用的所有积分活动' })
    },
    'online-payment': () => router.push(`/merchant/online-paying?apiKeyId=${ apiKey.id }`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold mb-4">应用服务</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {MERCHANT_ACTIONS.map((action) => (
            <button
              key={action.action}
              className="rounded-lg p-4 border border-dashed hover:border-primary/50 transition-all text-left group cursor-pointer"
              onClick={() => actionHandlers[action.action]()}
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-2 ${ action.bgColor }`}>
                  <action.icon className={`size-4 ${ action.color }`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm group-hover:text-foreground">{action.title}</h3>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-4">活动记录</h2>
        <div className="space-y-2">
          <TableFilter
            enabledFilters={{
              type: true,
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
            loading={loading}
          />

          <TransactionTableList
            loading={loading}
            error={error}
            transactions={transactions}
            onRetry={() => fetchTransactions({ page: 1, client_id: apiKey.client_id })}
            emptyDescription="未发现积分活动记录"
          />
        </div>
      </div>
    </div>
  )
}
