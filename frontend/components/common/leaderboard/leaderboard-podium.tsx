"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { LeaderboardEntry } from "@/lib/services/leaderboard"
import { Crown, Medal, Trophy } from "lucide-react"

interface LeaderboardPodiumProps {
  items: LeaderboardEntry[]
  loading?: boolean
}

const rankStyles = {
  1: {
    icon: Crown,
    iconClassName: "text-amber-500",
    rowClassName: "h-[68px] grid-cols-[44px_40px_minmax(0,1fr)_112px] bg-amber-500/[0.10] border-amber-400/45 px-4",
    badgeClassName: "text-amber-700 dark:text-amber-300",
    avatarClassName: "size-10",
    nameClassName: "text-sm",
    metaClassName: "text-amber-700/70 dark:text-amber-200/70",
    valueClassName: "text-lg leading-none text-amber-700 dark:text-amber-200",
  },
  2: {
    icon: Trophy,
    iconClassName: "text-slate-500 dark:text-slate-300",
    rowClassName: "h-[68px] grid-cols-[44px_40px_minmax(0,1fr)_112px] bg-muted/20 border-border/70 px-4",
    badgeClassName: "text-muted-foreground",
    avatarClassName: "size-10",
    nameClassName: "text-sm",
    metaClassName: "text-muted-foreground",
    valueClassName: "text-lg leading-none text-foreground",
  },
  3: {
    icon: Medal,
    iconClassName: "text-orange-600 dark:text-orange-400",
    rowClassName: "h-[68px] grid-cols-[44px_40px_minmax(0,1fr)_112px] bg-muted/20 border-border/70 px-4",
    badgeClassName: "text-muted-foreground",
    avatarClassName: "size-10",
    nameClassName: "text-sm",
    metaClassName: "text-muted-foreground",
    valueClassName: "text-lg leading-none text-foreground",
  },
} as const

function TopRankRow({
  entry,
  rank,
}: {
  entry: LeaderboardEntry
  rank: 1 | 2 | 3
}) {
  const style = rankStyles[rank]
  const Icon = style.icon

  return (
    <div className={cn("grid items-center gap-4 border border-dashed", style.rowClassName)}>
      <div className={cn("flex items-center justify-center", style.badgeClassName)}>
        <Icon className={cn("size-5 shrink-0", style.iconClassName)} />
      </div>

      <Avatar className={cn("rounded-full", style.avatarClassName)}>
        <AvatarImage src={entry.avatar_url} alt={entry.username} />
        <AvatarFallback className="text-sm font-semibold">
          {entry.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0">
        <div className={cn("truncate font-semibold", style.nameClassName)}>{entry.username}</div>
      </div>

      <div className="text-right">
        <div className={cn("text-[11px] font-medium", style.metaClassName)}>可用积分</div>
        <div className={cn("mt-0.5 font-semibold tabular-nums", style.valueClassName)}>
          {parseFloat(entry.available_balance).toFixed(2)}
        </div>
      </div>
    </div>
  )
}

export const LeaderboardPodium = React.memo(function LeaderboardPodium({
  items,
  loading,
}: LeaderboardPodiumProps) {
  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Top 3</h2>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "grid items-center gap-4 border border-dashed",
                index === 0
                  ? "h-[68px] grid-cols-[44px_40px_minmax(0,1fr)_112px] border-amber-400/35 px-4"
                  : "h-[68px] grid-cols-[44px_40px_minmax(0,1fr)_112px] border-border/70 px-4"
              )}
            >
              <Skeleton className="h-5 w-5" />
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-4 w-28" />
              <div className="space-y-2 justify-self-end">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Top 3</h2>
        <div className="py-12 text-center text-muted-foreground">
          暂无排行数据
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Top 3</h2>
      <div className="space-y-3">
        {items.map((entry, index) => (
          <TopRankRow
            key={entry.user_id}
            entry={entry}
            rank={(index + 1) as 1 | 2 | 3}
          />
        ))}
      </div>
    </section>
  )
})
