import * as React from "react"
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number"
import { TrendingUp, TrendingDown, ArrowRightLeft, Users } from "lucide-react"

import { useUser } from "@/contexts/user-context"


/**
 * 所有活动组件
 * 显示用户的所有活动统计数据
 */
export function AllActivity() {
  const { user, loading } = useUser()

  /* 统计数据 */
  const stats = React.useMemo(() => ({
    totalReceive: user?.total_receive ?? 0,
    totalPayment: user?.total_payment ?? 0,
    totalTransfer: user?.total_transfer ?? 0,
    totalCommunity: user?.total_community ?? 0
  }), [user])

  /* 功能卡片 */
  const statCards = [
    {
      title: "总收款",
      value: loading ? '-' : <CountingNumber number={stats.totalReceive} decimalPlaces={2} />,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    },
    {
      title: "总付款",
      value: loading ? '-' : <CountingNumber number={stats.totalPayment} decimalPlaces={2} />,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20"
    },
    {
      title: "总转账",
      value: loading ? '-' : <CountingNumber number={stats.totalTransfer} decimalPlaces={2} />,
      icon: ArrowRightLeft,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20"
    },
    {
      title: "总社区划转",
      value: loading ? '-' : <CountingNumber number={stats.totalCommunity} decimalPlaces={2} />,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20"
    }
  ]

  return (
    <>
      <div className="space-y-2 mt-2">
        <div className="font-semibold">数据概览</div>
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((card) => {
            const IconComponent = card.icon
            return (
              <div key={card.title} className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">
                    {card.title}
                  </div>
                  <div className={`p-1.5 rounded-full ${card.bgColor}`}>
                    <IconComponent className={`h-3 w-3 ${card.color}`} />
                  </div>
                </div>
                <div className="text-xl md:text-2xl font-bold mt-2">
                  {card.value}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
