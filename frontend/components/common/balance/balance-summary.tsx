import * as React from "react"
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number"

import { useUser } from "@/contexts/user-context"


/**
 * 余额摘要组件
 * 显示余额的可视化摘要，包括未来款项和可用余额的占比
 *
 * @example
 * ```tsx
 * <BalanceSummary />
 * ```
 */
export function BalanceSummary() {
  const { user, loading } = useUser()

  /* 从用户信息中获取余额数据 */
  const available = user?.available_balance ?? 0
  const community = user?.community_balance ?? 0
  const total = available + community
  const pending = total - available

  const pendingPercent = total > 0 
    ? (pending / total) * 100 
    : 0
  const availablePercent = total > 0 
    ? (available / total) * 100 
    : 0

  return (
    <div className="space-y-4">
      <div className="w-full h-4 bg-gray-100 dark:bg-gray-800 rounded-sm overflow-hidden flex">
        <div
          className="bg-[#6366F1]/80 transition-all duration-300"
          style={{ width: `${availablePercent}%` }}
          title={`可用: ${availablePercent.toFixed(1)}%`}
        />
        <div
          className="bg-gray-400/80 transition-all duration-300"
          style={{ width: `${pendingPercent}%` }}
          title={`未来款项: ${pendingPercent.toFixed(1)}%`}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-medium pb-2 border-b">
          <span>支付类型</span>
          <span>金额</span>
        </div>

        <div className="flex justify-between items-center font-bold text-sm pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="size-3 bg-[#6366F1]/80 rounded-xs" />
            <span>可用</span>
          </div>
          <span>{loading ? '-' : <CountingNumber number={available} decimalPlaces={2} />}</span>
        </div>

        <div className="flex justify-between items-center font-bold text-sm pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="size-3 bg-gray-400/80 rounded-xs" />
            <span>未来款项</span>
          </div>
          <span>{loading ? '-' : <CountingNumber number={pending} decimalPlaces={2} />}</span>
        </div>
      </div>
    </div>
  )
}
