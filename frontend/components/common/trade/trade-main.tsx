"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AllActivity } from "@/components/common/trade/all-activity"
import { Community } from "@/components/common/trade/community"
import { Payment } from "@/components/common/trade/payment"
import { Receive } from "@/components/common/trade/receive"
import { TradeTable } from "@/components/common/trade/trade-table"
import { Transfer } from "@/components/common/trade/transfer"
import { Online } from "@/components/common/trade/online"
import { RedEnvelope } from "@/components/common/trade/red-envelope"
import { TransactionProvider } from "@/contexts/transaction-context"
import services from "@/lib/services"
import type { OrderType } from "@/lib/services"

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

/** 标签值类型 */
type TabValue = OrderType | 'all' | 'redenvelope'

/** 页面组件映射表 */
const PAGE_COMPONENTS: Record<TabValue, React.ComponentType> = {
  receive: Receive,
  payment: Payment,
  transfer: Transfer,
  community: Community,
  online: Online,
  distribute: () => null,
  test: () => null,
  red_envelope_send: RedEnvelope,
  red_envelope_receive: RedEnvelope,
  redenvelope: RedEnvelope,
  all: AllActivity,
}

/**
 * 活动交易主页面组件
 * 
 * 负责组装活动交易中心的各个子组件
 */
export function TradeMain() {
  const [activeTab, setActiveTab] = React.useState<TabValue>('receive')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const [redEnvelopeEnabled, setRedEnvelopeEnabled] = React.useState(0)

  React.useEffect(() => {
    // 从公共配置中获取红包功能状态
    services.config.getPublicConfig()
      .then(res => setRedEnvelopeEnabled(res.red_envelope_enabled))
      .catch(() => setRedEnvelopeEnabled(0))
  }, [])

  /* 获取活动类型 */
  const getOrderType = (tab: TabValue): OrderType | undefined => {
    if (tab === 'all') return undefined
    return tab as OrderType
  }

  /* 渲染活动页面内容 */
  const renderPageContent = () => {
    const Component = PAGE_COMPONENTS[activeTab]
    return Component ? <Component /> : null
  }

  if (!mounted) {
    return (
      <div className="py-6">
        <h1 className="text-2xl font-semibold mb-4">积分活动</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <TransactionProvider defaultParams={{ page_size: 20 }}>
      <div className="py-6">
        <h1 className="text-2xl font-semibold mb-4">积分活动</h1>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
          className="w-full"
        >
          <div className="border-b border-border">
            <TabsList className="flex p-0 gap-4 rounded-none w-full bg-transparent justify-start h-auto overflow-x-auto overflow-y-hidden">
              <TabsTrigger value="receive" className={TAB_TRIGGER_STYLES}>积分收益</TabsTrigger>
              <TabsTrigger value="payment" className={TAB_TRIGGER_STYLES}>积分消耗</TabsTrigger>
              <TabsTrigger value="transfer" className={TAB_TRIGGER_STYLES}>积分转移</TabsTrigger>
              <TabsTrigger value="community" className={TAB_TRIGGER_STYLES}>社区划转</TabsTrigger>
              <TabsTrigger value="online" className={TAB_TRIGGER_STYLES}>在线流转</TabsTrigger>
              {redEnvelopeEnabled === 1 && (
                <TabsTrigger value="redenvelope" className={TAB_TRIGGER_STYLES}>红包</TabsTrigger>
              )}
              <TabsTrigger value="all" className={TAB_TRIGGER_STYLES}>所有活动</TabsTrigger>
            </TabsList>
          </div>

          <div className="pt-2 space-y-8">
            {renderPageContent()}

            {activeTab !== 'redenvelope' && (
              <div className="space-y-4">
                <h2 className="font-semibold">活动记录</h2>
                <TradeTable type={getOrderType(activeTab)} />
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </TransactionProvider>
  )
}
