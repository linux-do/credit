"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionTableList } from "@/components/common/general/table-data"
import { TransactionProvider, useTransaction } from "@/contexts/transaction-context"
import type { OrderType } from "@/lib/services"
import { formatLocalDate } from "@/lib/utils"

/** 标签触发器样式 */
const TAB_TRIGGER_STYLES =
  "data-[state=active]:bg-transparent " +
  "data-[state=active]:shadow-none " +
  "data-[state=active]:border-0 " +
  "data-[state=active]:border-b-2 " +
  "data-[state=active]:border-indigo-500 " +
  "bg-transparent " +
  "rounded-none " +
  "border-0 " +
  "border-b-2 " +
  "border-transparent " +
  "px-0 " +
  "text-sm " +
  "font-bold " +
  "text-muted-foreground " +
  "data-[state=active]:text-indigo-500 " +
  "-mb-[2px] " +
  "relative " +
  "hover:text-foreground " +
  "transition-colors " +
  "flex-none"

/** 标签配置 - 数据驱动渲染 */
const TABS = [
  { value: "receive" as const, label: "积分收益" },
  { value: "payment" as const, label: "积分消耗" },
  { value: "transfer" as const, label: "积分转移" },
  { value: "community" as const, label: "社区划转" },
  { value: "online" as const, label: "在线流转" },
  { value: "all" as const, label: "所有活动" },
] as const

/**
 * 计算最近30天的时间范围
 * 每次调用时重新计算，避免缓存过期时间
 */
function getTimeRange() {
  const now = new Date()
  now.setHours(23, 59, 59, 999)
  const start = new Date(now)
  start.setDate(start.getDate() - 30)
  start.setHours(0, 0, 0, 0)
  return {
    startTime: formatLocalDate(start),
    endTime: formatLocalDate(now)
  }
}

/**
 * 积分余额活动表格组件
 * 
 * 显示不同类型的积分余额活动记录,支持多标签切换和分页加载
 */
export function BalanceTable() {
  const [activeTab, setActiveTab] = React.useState<OrderType | "all">("all")
  const [timeRange, setTimeRange] = React.useState<{ startTime: string; endTime: string } | null>(null)

  React.useEffect(() => {
    setTimeRange(getTimeRange())
  }, [])

  if (!timeRange) {
    return null
  }

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as OrderType | "all")}
        className="w-full"
      >
        <TabsList className="flex p-0 gap-4 rounded-none w-full bg-transparent justify-start border-b border-border overflow-x-auto overflow-y-hidden">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={TAB_TRIGGER_STYLES}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-2">
          <TransactionProvider
            defaultParams={{
              page_size: 20,
              startTime: timeRange.startTime,
              endTime: timeRange.endTime,
            }}
          >
            <TransactionList
              type={activeTab === "all" ? undefined : activeTab}
            />
          </TransactionProvider>
        </div>
      </Tabs>
    </div>
  )
}

/**
 * 积分余额活动列表组件
 * 
 * 负责获取和显示积分余额活动数据
 */
const TransactionList = React.memo(function TransactionList({ type }: { type?: OrderType }) {
  const {
    transactions,
    loading,
    error,
    lastParams,
    fetchTransactions,
  } = useTransaction()

  /** 当积分余额活动类型变化时重新加载数据 */
  React.useEffect(() => {
    fetchTransactions({
      page: 1,
      type,
      startTime: lastParams.startTime,
      endTime: lastParams.endTime,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  return (
    <TransactionTableList
      loading={loading}
      error={error}
      transactions={transactions}
      onRetry={() => fetchTransactions({ page: 1 })}
    />
  )
})
