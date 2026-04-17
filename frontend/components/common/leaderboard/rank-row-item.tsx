"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { LeaderboardEntry } from "@/lib/services/leaderboard"

interface RankRowItemProps {
  entry: LeaderboardEntry
  rank: number
  isCurrentUser?: boolean
  metaLabel?: string
  pinned?: boolean
}

export const RankRowItem = React.memo(function RankRowItem({
  entry,
  rank,
  isCurrentUser,
  metaLabel = "排名用户",
  pinned = false,
}: RankRowItemProps) {
  return (
    <div
      className={cn(
        "grid h-[68px] grid-cols-[48px_minmax(0,1fr)_112px] items-center border-b border-dashed border-border/70 px-4 transition-colors",
        isCurrentUser && "bg-primary/5",
        pinned && "bg-primary/[0.07]"
      )}
    >
      <div className="text-sm font-medium tabular-nums text-muted-foreground">{rank}</div>

      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-9">
          <AvatarImage src={entry.avatar_url} alt={entry.username} />
          <AvatarFallback className="text-xs font-semibold">
            {entry.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{entry.username}</div>
          <div className="text-[11px] text-muted-foreground">{metaLabel}</div>
        </div>
      </div>

      <div className="text-right text-[15px] font-semibold tabular-nums">
        {parseFloat(entry.available_balance).toFixed(2)}
      </div>
    </div>
  )
})
