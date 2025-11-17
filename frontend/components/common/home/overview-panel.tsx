import * as React from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Area, AreaChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ExternalLink, Info, Eye, EyeOff } from "lucide-react"

import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

/* mock data */
const chartData = [
  { date: "10-31", value: 0 },
  { date: "11-01", value: 0 },
  { date: "11-02", value: 0 },
  { date: "11-03", value: 0 },
  { date: "11-04", value: 0.01 },
  { date: "11-05", value: 0 },
  { date: "11-06", value: 0 },
]

/* chart config */
const chartConfig = {
  value: {
    label: "数值",
    color: "hsl(217, 91%, 60%)",
  },
} satisfies ChartConfig

/**
 * 付款卡片
 * 展示付款数据
 */
function PaymentCard() {
  const [isHidden, setIsHidden] = React.useState(false)

  return (
    <Card className="bg-background border-0 shadow-none rounded-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">付款</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 p-0"
            onClick={() => setIsHidden(!isHidden)}
          >
            {isHidden ? (
              <EyeOff className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Eye className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center justify-between py-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center justify-between py-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center justify-between py-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        
        {isHidden && (
          <div className="absolute inset-0 backdrop-blur-md bg-background/30 rounded-lg flex items-center justify-center">
            <EyeOff className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 总额卡片（带图表）
 * @param {Object} props - 组件属性
 * @param {Object} props.dateRange - 日期范围
 * @param {Date} props.dateRange.from - 开始日期
 * @param {Date} props.dateRange.to - 结束日期
 * @returns {React.ReactNode} 总额卡片
 */
function TotalCard({ dateRange }: { dateRange: { from: Date; to: Date } | null }) {
  return (
    <Card className="bg-background border-0 shadow-none rounded-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">总额</CardTitle>
          <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
            <Info className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
        <div>
          <p className="text-xl font-semibold">LDC 100.00</p>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[120px] w-full">
          <AreaChart data={chartData} margin={{ left: 2, right: 2, top: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="value"
              type="monotone"
              fill="url(#totalGradient)"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
          {dateRange ? (
            <>
              <span>{format(dateRange.from, "MM月dd日", { locale: zhCN })}</span>
              <span>{format(dateRange.to, "MM月dd日", { locale: zhCN })}</span>
            </>
          ) : (
            <span className="w-full text-center">所有时间</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">更新时间：上午12:29</span>
          <Button variant="link" className="px-0 h-auto text-xs text-blue-600">
            查看更多
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 净交易额卡片
 * @param {Object} props - 组件属性
 * @param {Object} props.dateRange - 日期范围
 * @param {Date} props.dateRange.from - 开始日期
 * @param {Date} props.dateRange.to - 结束日期
 * @returns {React.ReactNode} 净交易额卡片
 */
function NetVolumeCard({ dateRange }: { dateRange: { from: Date; to: Date } | null }) {
  return (
    <Card className="bg-background border-0 shadow-none rounded-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">净交易额</CardTitle>
          <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
            <Info className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
        <div>
          <p className="text-xl font-semibold">LDC 100.00</p>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[120px] w-full">
          <AreaChart data={chartData} margin={{ left: 2, right: 2, top: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="value"
              type="monotone"
              fill="url(#netGradient)"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
          {dateRange ? (
            <>
              <span>{format(dateRange.from, "MM月dd日", { locale: zhCN })}</span>
              <span>{format(dateRange.to, "MM月dd日", { locale: zhCN })}</span>
            </>
          ) : (
            <span className="w-full text-center">所有时间</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">更新时间：上午12:29</span>
          <Button variant="link" className="px-0 h-auto text-xs text-blue-600">
            查看更多
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 支出最多的客户卡片
 * @returns {React.ReactNode} 支出最多的客户卡片
 */
function TopCustomersCard() {
  return (
    <Card className="bg-background border-0 shadow-none rounded-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium">支出最多的客户</CardTitle>
          <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 失败的付款卡片
 * @param {Object} props - 组件属性
 * @param {Object} props.dateRange - 日期范围
 * @param {Date} props.dateRange.from - 开始日期
 * @param {Date} props.dateRange.to - 结束日期
 * @returns {React.ReactNode} 失败的付款卡片
 */
function FailedPaymentsCard({ dateRange }: { dateRange: { from: Date; to: Date } | null }) {
  return (
    <Card className="bg-background border-0 shadow-none rounded-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">失败的付款</CardTitle>
          <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
            <Info className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
        <div>
          <p className="text-xl font-semibold">0</p>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[120px] w-full">
          <AreaChart data={chartData} margin={{ left: 2, right: 2, top: 5, bottom: 5 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="value"
              type="monotone"
              fill="hsl(var(--muted))"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          </AreaChart>
        </ChartContainer>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
          {dateRange ? (
            <>
              <span>{format(dateRange.from, "MM月dd日", { locale: zhCN })}</span>
              <span>{format(dateRange.to, "MM月dd日", { locale: zhCN })}</span>
            </>
          ) : (
            <span className="w-full text-center">所有时间</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">更新时间：上午12:29</span>
          <Button variant="link" className="px-0 h-auto text-xs text-blue-600">
            查看更多
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 有争议的付款卡片
 * @param {Object} props - 组件属性
 * @param {Object} props.dateRange - 日期范围
 * @param {Date} props.dateRange.from - 开始日期
 * @param {Date} props.dateRange.to - 结束日期
 * @returns {React.ReactNode} 有争议的付款卡片
 */
function DisputedPaymentsCard({ dateRange }: { dateRange: { from: Date; to: Date } | null }) {
  return (
    <Card className="bg-background border-0 shadow-none rounded-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">有争议的付款</CardTitle>
          <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
            <Info className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
        <div>
          <p className="text-xl font-semibold">0</p>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[120px] w-full">
          <AreaChart data={chartData} margin={{ left: 2, right: 2, top: 5, bottom: 5 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="value"
              type="monotone"
              fill="hsl(var(--muted))"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          </AreaChart>
        </ChartContainer>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
          {dateRange ? (
            <>
              <span>{format(dateRange.from, "MM月dd日", { locale: zhCN })}</span>
              <span>{format(dateRange.to, "MM月dd日", { locale: zhCN })}</span>
            </>
          ) : (
            <span className="w-full text-center">所有时间</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">更新时间：上午12:29</span>
          <Button variant="link" className="px-0 h-auto text-xs text-blue-600">
            查看更多
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 概览面板组件
 * @param {Object} props - 组件属性
 * @param {Object} props.dateRange - 日期范围
 * @param {Date} props.dateRange.from - 开始日期
 * @param {Date} props.dateRange.to - 结束日期
 * @returns {React.ReactNode} 概览面板组件
 */
interface OverviewPanelProps {
  dateRange: { from: Date; to: Date } | null
}

export function OverviewPanel({ dateRange }: OverviewPanelProps) {
  return (
    <div className="bg-muted rounded-lg p-2 mt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        <PaymentCard />
        <TotalCard dateRange={dateRange} />
        <NetVolumeCard dateRange={dateRange} />
        <TopCustomersCard />
        <FailedPaymentsCard dateRange={dateRange} />
        <DisputedPaymentsCard dateRange={dateRange} />
      </div>
    </div>
  )
}

