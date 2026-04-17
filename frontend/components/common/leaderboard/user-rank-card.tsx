"use client"

import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { UserRankResponse } from "@/lib/services/leaderboard"
import { UserRound } from "lucide-react"

interface UserRankCardProps {
  data: UserRankResponse | null
  loading?: boolean
  className?: string
}

export const UserRankCard = React.memo(function UserRankCard({
  data,
  loading,
  className,
}: UserRankCardProps) {
  if (loading) {
    return (
      <section className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <UserRound className="size-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">我的排名</h2>
        </div>
        <div className="space-y-4 px-1 py-1">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <UserRound className="size-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">我的排名</h2>
      </div>

      <div className="space-y-5 px-1 py-1">
        {data ? (
          <>
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">当前名次</div>
              <div className="text-3xl font-semibold tabular-nums">#{data.user.rank.toLocaleString()}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">可用积分</div>
              <div className="text-2xl font-semibold tabular-nums">{parseFloat(data.user.available_balance).toFixed(2)}</div>
            </div>
          </>
        ) : (
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground">当前状态</div>
            <div className="text-base font-medium">暂未进入榜单</div>
            <div className="text-sm text-muted-foreground">继续积累可用积分后会出现在排行榜中。</div>
          </div>
        )}
      </div>
    </section>
  )
})
