"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ErrorInline } from "@/components/layout/error"
import { EmptyStateWithBorder } from "@/components/layout/empty"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionDataTable } from "@/components/common/general/table-data"
import { Layers, ListRestart } from "lucide-react"

import type { OrderType } from "@/lib/services"
import { TransactionProvider, useTransaction } from "@/contexts/transaction-context"

/* 标签触发器样式 */
const TAB_TRIGGER_STYLES = "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-0 data-[state=active]:border-b-2 data-[state=active]:border-[#6366f1] bg-transparent rounded-none border-0 border-b-2 border-transparent px-0 text-sm font-bold text-muted-foreground data-[state=active]:text-[#6366f1] -mb-[2px] relative hover:text-foreground transition-colors flex-none"

/**
 * 余额活动表格组件
 * 显示收款、转账、社区划转和所有活动的交易记录（支持分页）
 * 
 * @example
 * ```tsx
 * <BalanceTable />
 * ```
 */
export function BalanceTable() {
  const [activeTab, setActiveTab] = useState<OrderType | 'all'>('all')

  /* 计算最近一个月的时间范围 */
  const getLastMonthRange = () => {
    const now = new Date()
    const endTime = now.toISOString()
    const startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    return { startTime, endTime }
  }

  const { startTime, endTime } = getLastMonthRange()

  return (
    <div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrderType | 'all')} className="w-full">
        <TabsList className="flex p-0 gap-4 rounded-none w-full bg-transparent justify-start border-b border-border">
          <TabsTrigger value="receive" className={TAB_TRIGGER_STYLES}>
            收款
          </TabsTrigger>
          <TabsTrigger value="payment" className={TAB_TRIGGER_STYLES}>
            付款
          </TabsTrigger>
          <TabsTrigger value="transfer" className={TAB_TRIGGER_STYLES}>
            转账
          </TabsTrigger>
          <TabsTrigger value="community" className={TAB_TRIGGER_STYLES}>
            社区划转
          </TabsTrigger>
          <TabsTrigger value="all" className={TAB_TRIGGER_STYLES}>
            所有活动
          </TabsTrigger>
        </TabsList>

        <div className="mt-2">
          <TransactionProvider defaultParams={{ page_size: 20, startTime, endTime }}>
            <TransactionList type={activeTab === 'all' ? undefined : activeTab} />
          </TransactionProvider>
        </div>
      </Tabs>
    </div>
  )
}

/**
 * 交易列表组件
 * 显示交易记录
 * 
 * @example
 * ```tsx
 * <TransactionList type="receive" />
 * ```
 * @param {OrderType} type - 交易类型
 * @returns {React.ReactNode} 交易列表组件
 */
function TransactionList({ type }: { type?: OrderType }) {
  const {
    transactions,
    total,
    currentPage,
    totalPages,
    loading,
    error,
    lastParams,
    fetchTransactions,
    loadMore,
  } = useTransaction()

  /* 重新加载数据 */
  useEffect(() => {
    fetchTransactions({ 
      page: 1, 
      type,
      startTime: lastParams.startTime,
      endTime: lastParams.endTime,
    })
  }, [type, fetchTransactions, lastParams.startTime, lastParams.endTime])

  /* 加载更多 */
  const handleLoadMore = () => {
    loadMore()
  }

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
      <TransactionDataTable transactions={transactions} />

      {currentPage < totalPages && (
        <Button
          variant="outline"
          onClick={handleLoadMore}
          disabled={loading}
          className="w-full text-xs border-dashed"
        >
          {loading ? (<><Spinner className="size-4" />正在加载</>) : (`加载更多 (${transactions.length}/${total})`)}
        </Button>
      )}

      {currentPage >= totalPages && total > 0 && (
        <div className="pt-2 text-center text-xs text-muted-foreground">
          已加载近期（7天）的 {total} 条记录
        </div>
      )}
    </div>
  )
}
