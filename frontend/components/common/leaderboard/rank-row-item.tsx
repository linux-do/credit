"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { LeaderboardEntry } from "@/lib/services/leaderboard"

const leaderboardRowColumns = "grid-cols-[72px_minmax(0,1fr)_112px] sm:grid-cols-[88px_minmax(0,1fr)_128px]"

interface RankRowItemProps {
  entry: LeaderboardEntry
  rank: number
  percentage?: number
  isCurrentUser?: boolean
  metaLabel?: string
  pinned?: boolean
}


export const RankRowItem = React.memo(function RankRowItem({
  entry,
  rank,
  percentage = 0,
  isCurrentUser,
  metaLabel,
  pinned = false,
}: RankRowItemProps) {
  const rankClass =
    rank === 1 ? "text-amber-500 font-black" :
    rank === 2 ? "text-zinc-400 font-bold" :
    rank === 3 ? "text-orange-500 font-bold" :
    "text-muted-foreground"

  return (
    <div
      className={cn(
        "relative grid h-[60px] items-center px-3 transition-colors hover:bg-muted/30",
        leaderboardRowColumns,
        isCurrentUser && !pinned && "bg-primary/[0.03]",
        pinned && "bg-transparent"
      )}
    >
      {/* 进度条背景 */}
      {percentage > 0 && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 transition-all duration-500"
          style={{
            width: `${Math.max(percentage, 4)}%`,
            background: "linear-gradient(to right, oklch(58.5% 51% 277.117 / 0.15) 65%, transparent)",
          }}
        />
      )}

      <div className={cn("relative truncate pr-2 text-sm tabular-nums", rankClass)}>
        #{rank}
      </div>

      <div className="relative flex min-w-0 items-center gap-3">
        <Avatar className="size-9 shrink-0">
          <AvatarImage src={entry.avatar_url} alt={entry.username} />
          <AvatarFallback className="text-xs font-semibold">
            {entry.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{entry.username}</div>
          {metaLabel && (
            <div className={cn("text-[11px]", pinned ? "text-primary/70" : "text-muted-foreground")}>
              {metaLabel}
            </div>
          )}
        </div>
      </div>

      <div className="relative text-right text-sm font-semibold tabular-nums text-foreground sm:text-[15px]">
        {parseFloat(entry.available_balance).toFixed(2)}
      </div>
    </div>
  )
})
