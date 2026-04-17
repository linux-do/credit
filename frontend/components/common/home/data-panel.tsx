import * as React from "react"
import { Area, AreaChart, XAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CountingNumber } from '@/components/animate-ui/primitives/texts/counting-number'
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

import { useUser } from "@/contexts/user-context"
import { DashboardService } from "@/lib/services"
import type { DailyStatsItem } from "@/lib/services"

const chartConfig = {
  total: {
    label: "总额",
    color: "hsl(217, 91%, 60%)",
  },
  income: {
    label: "收入",
    color: "#10b981",
  },
  expense: {
    label: "支出",
    color: "#f43f5e",
  },
} satisfies ChartConfig

function ResponsiveInfoTip({ children }: { children: React.ReactNode }) {
  const triggerClassName =
    "shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" aria-label="查看详情" className={`inline-flex ${triggerClassName} md:hidden`}>
            <Info className="size-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-fit max-w-[calc(100vw-2rem)] p-3 md:hidden">
          <p className="text-xs break-words">{children}</p>
        </PopoverContent>
      </Popover>

      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" aria-label="查看详情" className={`hidden ${triggerClassName} md:inline-flex`}>
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6} className="w-fit max-w-[calc(100vw-2rem)] px-2.5 py-1.5">
          <p className="text-xs leading-5 break-words">{children}</p>
        </TooltipContent>
      </Tooltip>
    </>
  )
}

/**
 * 数据面板组件
 * 展示用户数据和积分余额
 * @returns {React.ReactNode} 数据面板组件
 */
export function DataPanel() {
  const { user, loading: userLoading } = useUser()
  const [dailyStats, setDailyStats] = React.useState<DailyStatsItem[]>([])
  const [loading, setLoading] = React.useState(true)

  const availableBalance = parseFloat(user?.available_balance || '0')
  const pendingBalance = parseFloat(user?.pending_balance || '0')
  const remainQuota = parseFloat(user?.remain_quota || '0')

  /* 获取每日统计数据 */
  React.useEffect(() => {
    const fetchDailyStats = async () => {
      setLoading(true)
      const data = await DashboardService.getDailyStats(7)
      setDailyStats(data)
      setLoading(false)
    }

    if (!userLoading && user) {
      fetchDailyStats()
    }
  }, [userLoading, user])

  /* 根据当前余额和每日收支反推历史积分总额 */
  const chartData = React.useMemo(() => {
    if (!dailyStats.length || userLoading) return []

    const sortedStats = [...dailyStats].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    let currentBalance = availableBalance
    const balanceHistory: Array<{ date: string; total: number; income: number; expense: number }> = []

    for (let i = 0; i < sortedStats.length; i++) {
      const stat = sortedStats[i]
      const income = parseFloat(stat.income || '0')
      const expense = parseFloat(stat.expense || '0')

      balanceHistory.unshift({
        date: new Date(stat.date).toLocaleDateString('zh-CN', {
          month: 'numeric',
          day: 'numeric'
        }),
        total: Math.max(0, currentBalance),
        income,
        expense
      })

      currentBalance = currentBalance - income + expense
    }

    return balanceHistory
  }, [dailyStats, availableBalance, userLoading])

  return (
    <div className="flex flex-col md:grid md:grid-cols-3 gap-8 md:gap-12">
      <div className="md:col-span-2 order-1 md:order-none">
        <h3 className="text-sm text-muted-foreground font-medium mb-2">积分趋势</h3>

        {loading || userLoading ? (
          <div className="w-full h-[240px] flex items-center justify-center">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="w-full h-[240px] font-bold">
            <AreaChart
              data={chartData}
              margin={{
                left: 6,
                right: 6,
                top: 12,
                bottom: 12,
              }}
            >
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="total"
                type="monotone"
                fill="url(#colorTotal)"
                fillOpacity={0.4}
                stroke="var(--color-total)"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  fill: "hsl(217, 91%, 60%)",
                  stroke: "var(--background)",
                  strokeWidth: 2,
                  r: 4,
                }}
              />
              <Area
                dataKey="income"
                type="monotone"
                fill="none"
                stroke="#10b981"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{
                  fill: "#10b981",
                  stroke: "var(--background)",
                  strokeWidth: 2,
                  r: 4,
                }}
              />
              <Area
                dataKey="expense"
                type="monotone"
                fill="none"
                stroke="#f43f5e"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{
                  fill: "#f43f5e",
                  stroke: "var(--background)",
                  strokeWidth: 2,
                  r: 4,
                }}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="w-full h-[240px] flex items-center justify-center border border-dashed rounded-lg">
            <p className="text-xs text-muted-foreground">暂无统计数据</p>
          </div>
        )}
      </div>

      <div className="md:col-span-1 order-2 md:order-none flex flex-col divide-y divide-border/70 md:divide-y-0 md:pt-px">
        <div className="py-3 first:pt-0 md:border-b md:pb-4 md:pt-0">
          <div className="flex items-start justify-between gap-4 md:block">
            <div className="min-w-0 text-sm text-muted-foreground font-medium flex items-center gap-1 flex-wrap md:whitespace-nowrap">
            <span className="min-[400px]:hidden">可用LDC</span>
            <span className="hidden min-[400px]:inline">可用 LINUX DO Credits</span>
            <ResponsiveInfoTip>
              当前可立即使用的积分，不包含延迟到账中的未来积分。
            </ResponsiveInfoTip>
            </div>
            <div className="shrink-0 text-right text-xl font-semibold leading-none md:pt-2 md:text-left">
              {userLoading ? '-' : <CountingNumber number={availableBalance} decimalPlaces={2} />}
            </div>
          </div>
        </div>

        <div className="py-3 md:border-b md:pt-4 md:pb-4">
          <div className="flex items-start justify-between gap-4 md:block">
            <div className="min-w-0 text-sm text-muted-foreground font-medium flex items-center gap-1 flex-wrap md:whitespace-nowrap">
            <span className="min-[400px]:hidden">未来LDC</span>
            <span className="hidden min-[400px]:inline">未来 LINUX DO Credits</span>
            <ResponsiveInfoTip>
              流转后延迟到账的积分，到期后自动转入可用积分。
            </ResponsiveInfoTip>
            </div>
            <div className="shrink-0 text-right text-xl font-semibold leading-none md:pt-2 md:text-left">
              {userLoading ? '-' : <CountingNumber number={pendingBalance} decimalPlaces={2} />}
            </div>
          </div>
        </div>

        <div className="py-3 last:pb-0 md:pt-4 md:pb-0">
          <div className="flex items-start justify-between gap-4 md:block">
            <div className="min-w-0 text-sm text-muted-foreground font-medium flex items-center gap-1 flex-wrap">
            今日剩余额度
            <ResponsiveInfoTip>
              每日积分消耗额度限制，每日 0 点自动重置
            </ResponsiveInfoTip>
            </div>
            <div className="shrink-0 text-right text-xl font-semibold leading-none md:pt-2 md:text-left">
              {userLoading ? '-' : remainQuota < 0 ? "无限制" : <CountingNumber number={remainQuota} decimalPlaces={2} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
