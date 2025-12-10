"use client"

import * as React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Undo2, FileText, Link2 } from "lucide-react"
import { toast } from "sonner"
import { TableFilter } from "@/components/common/general/table-filter"
import { TransactionTableList } from "@/components/common/general/table-data"
import type { MerchantAPIKey, OrderType, OrderStatus } from "@/lib/services"
import { TransactionProvider, useTransaction } from "@/contexts/transaction-context"

/** 商家功能列表 */
const MERCHANT_ACTIONS = [
  {
    title: "处理争议",
    description: "获取此商户的所有争议",
    icon: Undo2,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    action: "refund",
  },
  {
    title: "所有订单",
    description: "显示此商户的所有交易",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    action: "view-all",
  },

  {
    title: "在线收款",
    description: "创建自定义支付链接",
    icon: Link2,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    action: "online-payment",
  },
]

interface MerchantDataProps {
  apiKey: MerchantAPIKey
}

/**
 * 商户数据组件
 * 显示应用的收款数据和统计信息
 */
export function MerchantData({ apiKey }: MerchantDataProps) {
  const getLastMonthRange = () => {
    const now = new Date()
    const endTime = now.toISOString()
    const startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    return { startTime, endTime }
  }

  const { startTime, endTime } = getLastMonthRange()

  return (
    <TransactionProvider
      defaultParams={{
        page_size: 20,
        startTime,
        endTime,
        client_id: apiKey.client_id
      }}
    >
      <MerchantDataContent apiKey={apiKey} />
    </TransactionProvider>
  )
}

/**
 * 商户数据内容组件
 */
function MerchantDataContent({ apiKey }: MerchantDataProps) {
  const router = useRouter()
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

  const [selectedTypes, setSelectedTypes] = React.useState<OrderType[]>([])
  const [selectedStatuses, setSelectedStatuses] = React.useState<OrderStatus[]>([])
  const [selectedQuickSelection, setSelectedQuickSelection] = React.useState<string | null>("最近 1 个月")
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date } | null>(() => {
    const now = new Date()
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    return { from, to: now }
  })

  const clearAllFilters = () => {
    setSelectedTypes([])
    setSelectedStatuses([])
    const now = new Date()
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    setDateRange({ from, to: now })
    setSelectedQuickSelection("最近 1 个月")
  }

  /**
   * 当筛选条件或 API key 改变时，重新加载数据
   */
  useEffect(() => {
    const params = {
      page: 1,
      page_size: 20,
      type: selectedTypes.length > 0 ? selectedTypes[0] as OrderType : undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses[0] as OrderStatus : undefined,
      startTime: dateRange ? dateRange.from.toISOString() : undefined,
      endTime: dateRange ? dateRange.to.toISOString() : undefined,
      client_id: apiKey.client_id,
    }

    fetchTransactions(params)
  }, [fetchTransactions, dateRange, selectedTypes, selectedStatuses, apiKey.client_id])

  const handleLoadMore = () => {
    loadMore()
  }

  const handleRefund = () => {
    setSelectedStatuses(['disputing'])

    toast.success('已切换至争议中订单', {
      description: '正在显示所有争议中的交易'
    })
  }

  const handleViewAllOrders = () => {
    clearAllFilters()

    toast.success('已显示所有订单', {
      description: '正在获取商户的所有交易'
    })
  }



  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold mb-4">商家操作</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {MERCHANT_ACTIONS.map((action, index) => {
            const Icon = action.icon

            return (
              <button
                key={index}
                className="rounded-lg p-4 border border-dashed hover:border-primary/50 shadow-none transition-all text-left group bg-background"
                onClick={() => {
                  if (action.action === 'refund') {
                    handleRefund()
                  } else if (action.action === 'view-all') {
                    handleViewAllOrders()

                  } else if (action.action === 'online-payment') {
                    router.push(`/merchant/online-paying?apiKeyId=${apiKey.id}`)
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className={`rounded-lg p-2 ${action.bgColor}`}>
                    <Icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm group-hover:text-foreground">{action.title}</h3>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-4">交易记录</h2>
        <div className="space-y-2">
          <TableFilter
            enabledFilters={{
              type: true,
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

          <TransactionTableList
            loading={loading}
            error={error}
            transactions={transactions}
            total={total}
            currentPage={currentPage}
            totalPages={totalPages}
            onRetry={() => fetchTransactions({ page: 1, client_id: apiKey.client_id })}
            onLoadMore={handleLoadMore}
            emptyDescription="未发现交易记录"
          />
        </div>
      </div>
    </div>
  )
}
