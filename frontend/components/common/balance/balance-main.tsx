"use client"

import * as React from "react"
import { BalanceTable } from "@/components/common/balance/balance-table"
import { BalanceReport } from "@/components/common/balance/balance-report"
import { BalanceSummary } from "@/components/common/balance/balance-summary"
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number"

import { useUser } from "@/contexts/user-context"


/**
 * 余额主页面组件
 * 负责组装余额页面的各个子组件
 * 
 * @example
 * ```tsx
 * <BalanceMain />
 * ```
 */
export function BalanceMain() {
  const { user, loading } = useUser()

  const totalBalance = (user?.available_balance ?? 0) + (user?.community_balance ?? 0)

  return (
    <div className="py-6">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <h1 className="text-2xl">
          <span className="font-semibold">余额</span>
          <span className="pl-2">LDC</span>
          <span className="pl-2">{loading ? '-' : <CountingNumber number={totalBalance} decimalPlaces={2} />}</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 pt-4">
        <div className="lg:col-span-3 space-y-12">
          <div>
            <div className="font-semibold mb-4">余额摘要</div>
            <BalanceSummary />
          </div>

          <div>
            <div className="font-semibold mb-4">近期活动</div>
            <BalanceTable />
          </div>
        </div>

        <div className="lg:col-span-1">
          <BalanceReport />
        </div>
      </div>
    </div>
  )
}
