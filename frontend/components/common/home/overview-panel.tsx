import * as React from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DisputeService, TransactionService, DashboardService } from "@/lib/services"
import type { DisputeWithOrder, Order, DailyStatsItem, TopCustomer } from "@/lib/services"
import { RefundReviewDialog, CancelDisputeDialog } from "@/components/common/general/table-data"
import { CountingNumber } from '@/components/animate-ui/primitives/texts/counting-number'
import { useDisputeData } from "@/hooks/use-dispute"
import { DisputeDialog } from "@/components/common/home/dispute-dialog"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

import { Spinner } from "@/components/ui/spinner"

function AnimatedProgressBar({ value, className }: { value: number, className?: string }) {
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(value), 100)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <Progress
      value={progress}
      className={cn("h-2 bg-muted", className)}
    />
  )
}

interface OverviewCardProps {
  title: string
  titleExtra?: React.ReactNode
  headerExtra?: React.ReactNode
  action?: React.ReactNode
  loading?: boolean
  onRefresh?: () => void
  onViewAll?: () => void
  children: React.ReactNode
  className?: string
}

function OverviewCard({
  title,
  titleExtra,
  headerExtra,
  action,
  loading,
  onRefresh,
  onViewAll,
  children,
  className
}: OverviewCardProps) {
  return (
    <Card className={cn("bg-background border-0 shadow-none rounded-lg min-h-[200px] flex flex-col h-full", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 h-6">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {titleExtra && <div className="font-semibold">{titleExtra}</div>}
          </div>
          <div className="flex items-center gap-2">
            {action}
            {onRefresh && (
              <Button variant="ghost" size="icon" className="size-4" onClick={onRefresh} disabled={loading}>
                <Spinner className={cn("size-3.5", !loading && "animate-none")} />
              </Button>
            )}
          </div>
        </div>
        {headerExtra && <div className="pt-1">{headerExtra}</div>}
      </CardHeader>
      <CardContent className="relative flex-1 -mt-4">
        {children}
      </CardContent>
      <CardFooter className="border-t h-8">
        <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
          <span>更新时间：{new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
          {onViewAll && (
            <Button variant="link" className="h-4 px-0 text-xs text-blue-600" disabled={loading} onClick={onViewAll}>
              查看全部
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

/**
 * 创建争议对象
 * @param dispute 争议对象
 * @param type 争议类型
 * @returns 争议对象
 */
const createDisputeOrder = (dispute: DisputeWithOrder, type: 'receive' | 'payment'): Order => ({
  id: dispute.order_id,
  dispute_id: dispute.id,
  type,
  status: 'disputing' as const,
  order_no: '',
  order_name: dispute.order_name,
  merchant_order_no: '',
  payer_user_id: '0',
  payee_user_id: '0',
  payer_username: '',
  payee_username: dispute.payee_username,
  amount: dispute.amount,
  remark: '',
  client_id: '',
  trade_time: '',
  expires_at: '',
  created_at: '',
  updated_at: '',
  payment_type: ''
})

/**
 * 争议列表骨架屏
 * 用于显示争议列表的加载状态
 * 
 * @returns 争议列表骨架屏
 */
const DisputeListSkeleton = () => (
  <div className="space-y-1">
    {Array.from({ length: 7 }).map((_, index) => (
      <div key={`skeleton-${ index }`} className="flex items-center justify-between py-1 px-2 rounded-md bg-muted/50">
        <div className="flex-1 min-w-0">
          <Skeleton className="h-3 w-32 mb-1" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <div className="ml-2">
          <Skeleton className="size-5 rounded-full" />
        </div>
      </div>
    ))}
  </div>
)

/**
 * 争议列表数据骨架屏
 */
const PaymentListSkeleton = () => (
  <div className="space-y-1">
    {Array.from({ length: 7 }).map((_, index) => (
      <div key={`payment-skeleton-${ index }`} className="flex items-center justify-between py-1 px-2 rounded-md bg-muted/50">
        <div className="flex-1 min-w-0">
          <Skeleton className="h-3 w-32 mb-1" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <div className="ml-2">
          <Skeleton className="h-5 w-16 rounded" />
        </div>
      </div>
    ))}
  </div>
)

/**
 * 获取活动状态显示文本
 */
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    success: '成功',
    pending: '待处理',
    failed: '失败',
    expired: '已过期',
    disputing: '争议中',
    refund: '已退回',
    refused: '已拒绝'
  }
  return statusMap[status] || status
}

/**
 * 获取活动状态样式
 */
const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'success':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'failed':
    case 'refused':
      return 'destructive'
    default:
      return 'outline'
  }
}

/**
 * 活动卡片
 * 用于显示活动列表数据
 * 
 * @returns 活动列表卡片
 */
function PaymentCard({ onViewAll }: { onViewAll: () => void }) {
  const [isHidden, setIsHidden] = React.useState(false)
  const [payments, setPayments] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)
  const [total, setTotal] = React.useState(0)

  const fetchPayments = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await TransactionService.getTransactions({
        page: 1,
        page_size: 10,
        type: 'payment',
        status: 'success'
      })
      setPayments(response.orders)
      setTotal(response.total)
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  return (

    <OverviewCard
      title="活动"
      titleExtra={loading ? '-' : <CountingNumber number={total} decimalPlaces={0} />}
      loading={loading}
      onRefresh={fetchPayments}
      onViewAll={onViewAll}
      action={
        <Button variant="ghost" size="icon" className="size-4" onClick={() => setIsHidden(!isHidden)}>
          {isHidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
        </Button>
      }
    >
      <ScrollArea className="h-46">
        {loading ? (
          <PaymentListSkeleton />
        ) : payments.length > 0 ? (
          <div className="space-y-1">
            {payments.map((payment) => (
              <div key={`payment-${ payment.id }`} className="flex items-center justify-between py-1 px-2 rounded-md bg-muted/50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate leading-tight">{payment.order_name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">LDC {payment.amount}</p>
                </div>
                <Badge variant={getStatusVariant(payment.status)} className="text-[10px] px-1.5 py-0 ml-2">
                  {getStatusText(payment.status)}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-46 flex items-center justify-center">
            <p className="text-muted-foreground text-xs">暂无积分活动记录</p>
          </div>
        )}
      </ScrollArea>

      {isHidden && (
        <div className="absolute inset-0 backdrop-blur-md bg-background/30 rounded-lg flex items-center justify-center">
          <EyeOff className="h-8 w-8 text-muted-foreground/50" />
        </div>
      )}
    </OverviewCard>
  )
}

/**
 * 收入统计卡片
 * 用于显示每日收入统计
 * 
 * @returns 收入统计卡片
 */
function IncomeStatsCard() {
  const [stats, setStats] = React.useState<DailyStatsItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [days] = React.useState(7)

  const fetchDailyStats = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await DashboardService.getDailyStats(days)
      //setStats(data)
      const newStats: DailyStatsItem[] = []
      data.forEach((stat, i) => {
        let income = parseFloat(stat.income || "0");
        if (income < 0) {
          income = 0;
        }
        newStats[i] = {
          date: stat.date,
          income: String(income),
          expense: stat.expense
        }
  });

  setStats(newStats);
    } catch (error) {
      console.error('Failed to fetch daily stats:', error)
    } finally {
      setLoading(false)
    }
  }, [days])

  React.useEffect(() => {
    fetchDailyStats()
  }, [fetchDailyStats])

  // 计算总收入
  const totalIncome = stats.reduce((sum, stat) => sum + parseFloat(stat.income || '0'), 0)

  // 找出最大收入值用于比例计算
  const maxIncome = Math.max(...stats.map(s => parseFloat(s.income || '0')))

  return (
    <OverviewCard
      title="7天收入统计"
      headerExtra={
        <div className="text-xl font-semibold">
          {loading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <>LDC <CountingNumber number={totalIncome} decimalPlaces={2} /></>
          )}
        </div>
      }
      loading={loading}
      onRefresh={fetchDailyStats}
    >
      {loading ? (
        <ScrollArea className="h-46 w-full">
          <div className="space-y-1.5 pr-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={`income-skeleton-${ index }`} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-sm" />
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : stats.length > 0 ? (
        <ScrollArea className="h-46 w-full">
          <div className="space-y-1.5 pr-3">
            {stats.slice().reverse().map((stat, index) => {
              const income = parseFloat(stat.income || '0')
              const incomeWidth = maxIncome > 0 ? (income / maxIncome) * 100 : 0

              return (
                <div key={stat.date || index} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(stat.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-green-600 font-medium">
                      +{income.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-muted rounded-sm overflow-hidden h-2">
                    <AnimatedProgressBar
                      value={incomeWidth}
                      className="h-full rounded-sm [&>[data-slot=progress-indicator]]:bg-green-500/80"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="h-46 w-full flex items-center justify-center border border-dashed rounded-lg">
          <p className="text-xs text-muted-foreground">暂无统计数据</p>
        </div>
      )}
    </OverviewCard>
  )
}

/**
 * 支出统计卡片
 * 用于显示每日支出统计
 * 
 * @returns 支出统计卡片
 */
function ExpenseStatsCard() {
  const [stats, setStats] = React.useState<DailyStatsItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [days] = React.useState(7)

  const fetchDailyStats = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await DashboardService.getDailyStats(days)
      //setStats(data)
      const newStats: DailyStatsItem[] = []
      data.forEach((stat, i) => {
        let income = parseFloat(stat.income || '0');
        let expense = parseFloat(stat.expense || '0');
        if (income < 0) {
          expense = expense - income;
          income = 0;
        } 
        newStats[i] = {
          date: stat.date,
          income: String(income),
          expense: String(expense),
        }
      })
      setStats(newStats);
    } catch (error) {
      console.error('Failed to fetch daily stats:', error)
    } finally {
      setLoading(false)
    }
  }, [days])

  React.useEffect(() => {
    fetchDailyStats()
  }, [fetchDailyStats])

  /* 计算总支出 */
  const totalExpense = stats.reduce((sum, stat) => sum + parseFloat(stat.expense || '0'), 0)

  /* 找出最大支出值用于比例计算 */
  const maxExpense = Math.max(...stats.map(s => parseFloat(s.expense || '0')))

  return (
    <OverviewCard
      title="7天支出统计"
      headerExtra={
        <div className="text-xl font-semibold">
          {loading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <>LDC <CountingNumber number={totalExpense} decimalPlaces={2} /></>
          )}
        </div>
      }
      loading={loading}
      onRefresh={fetchDailyStats}
    >
      {loading ? (
        <ScrollArea className="h-46 w-full">
          <div className="space-y-1.5 pr-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={`expense-skeleton-${ index }`} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-sm" />
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : stats.length > 0 ? (
        <ScrollArea className="h-46 w-full">
          <div className="space-y-1.5 pr-3">
            {stats.slice().reverse().map((stat, index) => {
              const expense = parseFloat(stat.expense || '0')
              const expenseWidth = maxExpense > 0 ? (expense / maxExpense) * 100 : 0

              return (
                <div key={stat.date || index} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(stat.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-red-600 font-medium">
                      -{expense.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-muted rounded-sm overflow-hidden h-2">
                    <AnimatedProgressBar
                      value={expenseWidth}
                      className="h-full rounded-sm [&>[data-slot=progress-indicator]]:bg-red-500/80"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="h-46 w-full flex items-center justify-center border border-dashed rounded-lg">
          <p className="text-xs text-muted-foreground">暂无统计数据</p>
        </div>
      )}
    </OverviewCard>
  )
}



/**
 * Top 客户卡片
 * 用于显示向当前用户付款最多的客户排行
 *
 * @returns Top 客户卡片
 */
function TopCustomersCard() {
  const [customers, setCustomers] = React.useState<TopCustomer[]>([])
  const [loading, setLoading] = React.useState(true)
  const [days] = React.useState(7)
  const [limit] = React.useState(5)

  const fetchTopCustomers = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await DashboardService.getTopCustomers(days, limit)
      setCustomers(data)
    } catch (error) {
      console.error('Failed to fetch top customers:', error)
    } finally {
      setLoading(false)
    }
  }, [days, limit])

  React.useEffect(() => {
    fetchTopCustomers()
  }, [fetchTopCustomers])

  /* 找出最大金额用于显示进度条 */
  const maxAmount = customers && customers.length > 0
    ? Math.max(...customers.map(c => parseFloat(c.total_amount || '0')))
    : 0

  return (
    <OverviewCard
      title="Top 客户统计"
      loading={loading}
      onRefresh={fetchTopCustomers}
    >
      <ScrollArea className="h-46">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={`customer-skeleton-${ index }`} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-6" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-2 w-full rounded-full" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            ))}
          </div>
        ) : customers && customers.length > 0 ? (
          <div className="space-y-2 pr-3">
            {customers.map((customer, index) => {
              const amount = parseFloat(customer.total_amount || '0')
              const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0

              return (
                <div key={customer.user_id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs font-semibold text-muted-foreground shrink-0">#{index + 1}</span>
                      <span className="text-xs font-medium truncate">{customer.username}</span>
                    </div>
                    <div className="text-xs font-semibold shrink-0 ml-2">
                      {amount.toFixed(2)} LDC
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <AnimatedProgressBar
                        value={percentage}
                        className="h-2 rounded-full"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 w-8 text-right">
                      {customer.order_count}单
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="h-46 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">暂无客户数据</p>
          </div>
        )}
      </ScrollArea>
    </OverviewCard>
  )
}

/**
 * 待处理的争议卡片
 * 用于显示待处理的争议数据
 * 
 * @returns 待处理的争议卡片
 */
function PendingDisputesCard({ onViewAll }: { onViewAll: () => void }) {
  const { disputes, loading, handleRefresh, refetchData } = useDisputeData({
    fetchFn: (params) => DisputeService.listMerchantDisputes(params)
  })

  return (
    <OverviewCard
      title="待处理的争议"
      titleExtra={loading ? '-' : <CountingNumber number={disputes.count} decimalPlaces={0} />}
      loading={loading}
      onRefresh={handleRefresh}
      onViewAll={onViewAll}
    >
      <ScrollArea className="h-46">
        {loading ? (
          <DisputeListSkeleton />
        ) : disputes.list.length > 0 ? (
          <div className="space-y-1">
            {disputes.list.map((dispute) => (
              <div key={`merchant-${ dispute.id }`} className="flex items-center justify-between py-1 px-2 rounded-md bg-muted/50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate leading-tight">{dispute.order_name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{dispute.payee_username}</p>
                </div>
                <div className="ml-2">
                  <RefundReviewDialog order={createDisputeOrder(dispute, 'receive')} onSuccess={refetchData} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-46 flex items-center justify-center">
            <p className="text-muted-foreground text-xs">暂无待处理的积分活动争议</p>
          </div>
        )}
      </ScrollArea>
    </OverviewCard>
  )
}

/**
 * 我发起的争议卡片
 * 用于显示我发起的争议数据
 * 
 * @returns 我发起的争议卡片
 */
function MyDisputesCard({ onViewAll }: { onViewAll: () => void }) {
  const { disputes, loading, handleRefresh, refetchData } = useDisputeData({
    fetchFn: (params) => DisputeService.listDisputes(params)
  })

  return (
    <OverviewCard
      title="我发起的争议"
      titleExtra={loading ? '-' : <CountingNumber number={disputes.count} decimalPlaces={0} />}
      loading={loading}
      onRefresh={handleRefresh}
      onViewAll={onViewAll}
    >
      <ScrollArea className="h-46">
        {loading ? (
          <DisputeListSkeleton />
        ) : disputes.list.length > 0 ? (
          <div className="space-y-1">
            {disputes.list.map((dispute) => (
              <div key={`user-${ dispute.id }`} className="flex items-center justify-between py-1 px-2 rounded-md bg-muted/50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate leading-tight">{dispute.order_name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">积分活动发起者正在处理争议</p>
                </div>
                <div className="ml-2">
                  <CancelDisputeDialog order={createDisputeOrder(dispute, 'payment')} onSuccess={refetchData} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-46 flex items-center justify-center">
            <p className="text-muted-foreground text-xs">暂无我发起的积分活动争议</p>
          </div>
        )}
      </ScrollArea>
    </OverviewCard>
  )
}

/**
 * 概览面板组件
 * 用于显示概览面板
 * 
 * @returns 概览面板组件
 */
export function OverviewPanel() {
  const router = useRouter()
  const [disputeDialogOpen, setDisputeDialogOpen] = React.useState(false)
  const [disputeDialogMode, setDisputeDialogMode] = React.useState<'pending' | 'my-disputes'>('pending')

  const handleViewAllPending = () => {
    setDisputeDialogMode('pending')
    setDisputeDialogOpen(true)
  }

  const handleViewAllMyDisputes = () => {
    setDisputeDialogMode('my-disputes')
    setDisputeDialogOpen(true)
  }

  const handleViewAllPayments = () => {
    router.push('/trade?type=payment')
  }

  return (
    <>
      <div className="bg-muted rounded-lg p-2 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <PaymentCard onViewAll={handleViewAllPayments} />
          <IncomeStatsCard />
          <ExpenseStatsCard />
          <TopCustomersCard />
          <PendingDisputesCard onViewAll={handleViewAllPending} />
          <MyDisputesCard onViewAll={handleViewAllMyDisputes} />
        </div>
      </div>

      <DisputeDialog
        mode={disputeDialogMode}
        open={disputeDialogOpen}
        onOpenChange={setDisputeDialogOpen}
      />
    </>
  )
}
