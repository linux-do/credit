"use client"

import * as React from "react"
import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Receive } from "@/components/common/trade/receive"
import { Payment } from "@/components/common/trade/payment"
import { Transfer } from "@/components/common/trade/transfer"
import { Community } from "@/components/common/trade/community"
import { AllActivity } from "@/components/common/trade/all-activity"
import { TradeTable } from "@/components/common/trade/trade-table"

import type { OrderType } from "@/lib/services"
import { TransactionProvider } from "@/contexts/transaction-context"


/* 标签触发器样式 */
const TAB_TRIGGER_STYLES = "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-0 data-[state=active]:border-b-2 data-[state=active]:border-[#6366f1] bg-transparent rounded-none border-0 border-b-2 border-transparent px-0 text-sm font-bold text-muted-foreground data-[state=active]:text-[#6366f1] -mb-[2px] relative hover:text-foreground transition-colors flex-none"

/* 标签值类型 */
type TabValue = OrderType | 'all'

/**
 * 交易主页面组件
 * 负责组装交易中心的各个子组件
 */
export function TradeMain() {
  const [activeTab, setActiveTab] = useState<TabValue>('receive')

  /* 获取订单类型 */
  const getOrderType = (tab: TabValue): OrderType | undefined => {
    if (tab === 'all') return undefined
    return tab as OrderType
  }

  /* 渲染页面内容 */
  const renderPageContent = () => {
    switch (activeTab) {
      case 'receive':
        return <Receive />
      case 'payment':
        return <Payment />
      case 'transfer':
        return <Transfer />
      case 'community':
        return <Community />
      case 'all':
        return <AllActivity />
      default:
        return null
    }
  }

  return (
    <TransactionProvider defaultParams={{ page_size: 20 }}>
      <div className="py-6">
        <h1 className="pb-2 text-2xl font-semibold">交易</h1>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
          <div>
            <TabsList className="w-full">
              <TabsTrigger value="receive" className={TAB_TRIGGER_STYLES}>收款</TabsTrigger>
              <TabsTrigger value="payment" className={TAB_TRIGGER_STYLES}>付款</TabsTrigger>
              <TabsTrigger value="transfer" className={TAB_TRIGGER_STYLES}>转账</TabsTrigger>
              <TabsTrigger value="community" className={TAB_TRIGGER_STYLES}>社区划转</TabsTrigger>
              <TabsTrigger value="all" className={TAB_TRIGGER_STYLES}>所有活动</TabsTrigger>
            </TabsList>
          </div>

          <div className="pt-2">{renderPageContent()}</div>

          <div className="font-semibold pt-6 pb-2">交易记录</div>
          <TradeTable type={getOrderType(activeTab)} />
        </Tabs>
      </div>
    </TransactionProvider>
  )
}
