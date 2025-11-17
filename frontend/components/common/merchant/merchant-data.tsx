"use client"

import * as React from "react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ErrorInline } from "@/components/layout/error"
import { EmptyStateWithBorder } from "@/components/layout/empty"
import { TableFilter } from "@/components/common/general/table-filter"
import { TransactionDataTable } from "@/components/common/general/table-data"
import { RefreshCw, Undo2, FileText, Settings, BarChart3, Zap, Layers, ListRestart } from "lucide-react"

import type { MerchantAPIKey, OrderType, OrderStatus } from "@/lib/services"
import { TransactionProvider, useTransaction } from "@/contexts/transaction-context"


interface MerchantDataProps {
  /** 当前选中的 API Key */
  apiKey: MerchantAPIKey
}

/**
 * 商户数据组件
 * 显示应用的收款数据和统计信息
 */
export function MerchantData({ apiKey }: MerchantDataProps) {
  // 计算最近一个月的时间范围
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
            onRetry={() => fetchTransactions({ page: 1, client_id: apiKey.client_id })}
            className="justify-center"
          />
        </div>
      )
    }

    if (!transactions || transactions.length === 0) {
      return (
        <EmptyStateWithBorder
          icon={Layers}
          description="未发现交易记录"
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

  const merchantActions = [
    {
      title: "处理退款",
      description: "为客户办理退款操作",
      icon: Undo2,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      action: "refund",
    },
    {
      title: "查看订单",
      description: "查看详细的订单信息",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      action: "view-order",
    },
    {
      title: "刷新数据",
      description: "同步最新的交易数据",
      icon: RefreshCw,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      action: "refresh",
    },
    {
      title: "API 设置",
      description: "配置 Webhook 和通知",
      icon: Settings,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      action: "settings",
    },
    {
      title: "数据报表",
      description: "查看详细的统计报表",
      icon: BarChart3,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
      action: "reports",
    },
    {
      title: "快速测试",
      description: "创建测试订单验证集成",
      icon: Zap,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      action: "test",
    },
  ]


  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold mb-4">商家操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {merchantActions.map((action, index) => {
            const Icon = action.icon

            return (
              <button
                key={index}
                className="rounded-lg p-4 border border-dashed hover:border-primary/50 shadow-nonetransition-all text-left group"
                onClick={() => {
                  console.log('Action clicked:', action.action)
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`rounded-lg p-2 ${action.bgColor}`}>
                    <Icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm group-hover:text-foreground">{action.title}</h3>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{action.description}</p>
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

          {renderContent()}
        </div>
      </div>
    </div>
  )
}
