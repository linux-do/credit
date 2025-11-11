"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, ArrowRightLeft, Users } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function AllActivity() {

  // 预留假数据
  const stats = React.useMemo(() => ({
    totalReceive: 1234.56,
    totalPayment: 567.89,
    totalTransfer: 890.12,
    totalCommunity: 345.67
  }), [])

  const statCards = [
    {
      title: "总收款",
      value: stats.totalReceive.toFixed(2),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    },
    {
      title: "总付款",
      value: stats.totalPayment.toFixed(2),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20"
    },
    {
      title: "总转账",
      value: stats.totalTransfer.toFixed(2),
      icon: ArrowRightLeft,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20"
    },
    {
      title: "总社区划转",
      value: stats.totalCommunity.toFixed(2),
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

      <Separator className="my-6" />
    </>
  )
}
