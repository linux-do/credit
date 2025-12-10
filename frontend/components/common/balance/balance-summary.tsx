import * as React from "react"
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number"
import { useUser } from "@/contexts/user-context"

/** 颜色配置 - 统一管理主题色 */
const COLORS = {
  available: "bg-indigo-500/80",
  pending: "bg-zinc-400/80",
  emptyState: "bg-gray-100 dark:bg-gray-800",
} as const

/**
 * 计算余额百分比
 */
function calculatePercentages(available: number, total: number) {
  if (total <= 0) {
    return { available: 0, pending: 0 }
  }

  const pending = total - available
  return {
    available: (available / total) * 100,
    pending: (pending / total) * 100,
  }
}

/**
 * 余额摘要组件
 * 
 * 显示余额的可视化摘要,包括可视化进度条和详细的余额分类列表
 */
export function BalanceSummary() {
  const { user, loading } = useUser()

  const available = user?.available_balance ?? 0
  const community = user?.community_balance ?? 0
  const total = available + community
  const pending = total - available

  const percentages = React.useMemo(
    () => calculatePercentages(available, total),
    [available, total]
  )

  return (
    <div className="space-y-4">
      <div
        className={`w-full h-4 ${ COLORS.emptyState } rounded-sm overflow-hidden flex`}
        role="progressbar"
        aria-label="余额分布"
        aria-valuenow={percentages.available}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${ COLORS.available } transition-all duration-300`}
          style={{ width: `${ percentages.available }%` }}
          title={`可用: ${ percentages.available.toFixed(1) }%`}
        />
        <div
          className={`${ COLORS.pending } transition-all duration-300`}
          style={{ width: `${ percentages.pending }%` }}
          title={`未来款项: ${ percentages.pending.toFixed(1) }%`}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-medium pb-2 border-b border-border/80">
          <span>支付类型</span>
          <span className="text-muted-foreground">金额</span>
        </div>

        <div className="flex justify-between items-center font-bold text-sm pb-2 border-b border-border/80">
          <div className="flex items-center gap-2">
            <div className={`size-2.5 ${ COLORS.available } rounded-xs`} aria-hidden="true" />
            <span>可用</span>
          </div>
          <span className="font-semibold">
            {loading ? "-" : (
              <CountingNumber
                number={typeof available === 'number' && !isNaN(available) ? available : 0}
                decimalPlaces={2}
                initiallyStable={true}
                inView={true}
                inViewOnce={true}
              />
            )} LDC
          </span>
        </div>

        <div className="flex justify-between items-center font-bold text-sm pb-2 border-b border-border/80">
          <div className="flex items-center gap-2">
            <div className={`size-2.5 ${ COLORS.pending } rounded-xs`} aria-hidden="true" />
            <span>未来款项</span>
          </div>
          <span className="font-semibold">
            {loading ? "-" : (
              <CountingNumber
                number={typeof pending === 'number' && !isNaN(pending) ? pending : 0}
                decimalPlaces={2}
                initiallyStable={true}
                inView={true}
                inViewOnce={true}
              />
            )} LDC
          </span>
        </div>
      </div>
    </div>
  )
}
