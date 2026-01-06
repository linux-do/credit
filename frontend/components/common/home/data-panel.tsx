import * as React from "react"
import { Area, AreaChart, XAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CountingNumber } from '@/components/animate-ui/primitives/texts/counting-number'
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
  const remainQuota = parseFloat(user?.remain_quota || '0')
  const communityBalance = parseFloat(user?.community_balance || '0').toLocaleString()

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
      {/* 积分趋势图表区域 - 移动端在上方，桌面端占左侧 2/3 */}
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

      {/* 统计数据区域 - 移动端在下方并排展示，桌面端在右侧垂直展示 */}
      <div className="md:col-span-1 flex flex-row md:flex-col order-2 md:order-none gap-8 md:gap-0">
        <div className="flex-1 md:border-b md:pb-4 border-r md:border-r-0 border-border pr-8 md:pr-0">
          <div className="text-sm text-muted-foreground font-medium flex items-center gap-1 whitespace-nowrap">
            可用 LINUX DO Credits
            <Popover>
              <PopoverTrigger>
                <Info className="size-3.5 cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent side="top" className="w-auto max-w-[280px] p-3">
                <p className="text-xs">社区基准分数(上一次从社区同步的积分基准值): {userLoading ? '-' : communityBalance} </p>
              </PopoverContent>
            </Popover>
          </div>
          <div className="text-xl font-semibold pt-2">
            {userLoading ? '-' : <CountingNumber number={availableBalance} decimalPlaces={2} />}
          </div>
        </div>

        <div className="flex-1 md:pt-4 pl-0 md:pl-0">
          <div className="text-sm text-muted-foreground font-medium flex items-center gap-1 whitespace-nowrap">
            今日剩余额度
            <Popover>
              <PopoverTrigger>
                <Info className="size-3.5 cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent side="top" className="w-auto max-w-[280px] p-3">
                <p className="text-xs">每日积分消耗额度限制，每日 0 点自动重置</p>
              </PopoverContent>
            </Popover>
          </div>
          <div className="text-xl font-semibold pt-2">
            {userLoading ? '-' : remainQuota < 0 ? "无限制" : <CountingNumber number={remainQuota} decimalPlaces={2} />}
          </div>
        </div>
      </div>
    </div>
  )
}
