"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { LeaderboardEntry } from "@/lib/services/leaderboard"


interface LeaderboardPodiumProps {
  items: LeaderboardEntry[]
  loading?: boolean
}

type PodiumRank = 1 | 2 | 3

function formatBalance(value: string) {
  return Number.parseFloat(value).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const rankConfig = {
  1: {
    numColor: "from-amber-500/60 to-amber-500/8",
    scoreColor: "text-amber-500",
    avatarSize: "size-16 sm:size-[72px]",
    numSize: "text-[72px] sm:text-[88px]",
    nameSize: "text-base font-bold",
    scoreSize: "text-lg font-black",
    avatarNegMt: "-mt-6 sm:-mt-7",
    order: "md:order-2",
    shift: "",
  },
  2: {
    numColor: "from-zinc-400/45 to-zinc-400/5",
    scoreColor: "text-zinc-400",
    avatarSize: "size-12 sm:size-[52px]",
    numSize: "text-[52px] sm:text-[64px]",
    nameSize: "text-sm font-semibold",
    scoreSize: "text-sm font-bold",
    avatarNegMt: "-mt-5",
    order: "md:order-1",
    shift: "md:translate-y-9",
  },
  3: {
    numColor: "from-orange-500/55 to-orange-500/8",
    scoreColor: "text-orange-500",
    avatarSize: "size-12 sm:size-[52px]",
    numSize: "text-[52px] sm:text-[64px]",
    nameSize: "text-sm font-semibold",
    scoreSize: "text-sm font-bold",
    avatarNegMt: "-mt-5",
    order: "md:order-3",
    shift: "md:translate-y-14",
  },
} as const

function PodiumSkeleton() {
  return (
    <div className="rounded-2xl bg-muted/25 px-6 pb-10 pt-6 sm:px-14">
      <div className="grid grid-cols-3 items-end gap-4 sm:gap-12">
        {([2, 1, 3] as PodiumRank[]).map((rank) => {
          const cfg = rankConfig[rank]
          return (
            <div key={rank} className={cn("flex flex-col items-center gap-0", cfg.order)}>
              <Skeleton className={cn("rounded-lg", rank === 1 ? "h-[100px] w-[76px]" : "h-[72px] w-[52px]")} />
              <Skeleton className={cn("shrink-0 rounded-full", cfg.avatarSize, cfg.avatarNegMt)} />
              <Skeleton className="mt-3 h-4 w-[70%]" />
              <Skeleton className="mt-1.5 h-4 w-[45%]" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PodiumColumn({ entry, rank }: { entry: LeaderboardEntry; rank: PodiumRank }) {
  const cfg = rankConfig[rank]

  return (
    <article className={cn("flex min-w-0 flex-col items-center", cfg.order, cfg.shift)}>

      <div
        className={cn(
          "select-none bg-clip-text text-transparent font-black leading-none tracking-[-0.05em] -mt-8",
          cfg.numSize,
          `bg-linear-to-b ${cfg.numColor}`,
        )}
      >
        {String(rank).padStart(2, "0")}
      </div>

      <Avatar className={cn("shrink-0 rounded-full", cfg.avatarSize, cfg.avatarNegMt)}>
        <AvatarImage src={entry.avatar_url} alt={entry.username} className="object-cover" />
        <AvatarFallback className={cn("rounded-full font-bold", rank === 1 ? "text-sm" : "text-xs")}>
          {entry.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className={cn("mt-2.5 w-full truncate text-center tracking-tight text-foreground", cfg.nameSize)}>
        {entry.username}
      </div>

      <div className={cn("mt-0.5 mb-3 tabular-nums tracking-tight", cfg.scoreSize, cfg.scoreColor)}>
        {formatBalance(entry.available_balance)}
      </div>

    </article>
  )
}

export const LeaderboardPodium = React.memo(function LeaderboardPodium({
  items,
  loading,
}: LeaderboardPodiumProps) {
  if (loading) return <PodiumSkeleton />

  if (items.length === 0) {
    return <div className="py-16 text-center text-muted-foreground">暂无排行数据</div>
  }

  const ordered = [
    items[1] ? { entry: items[1], rank: 2 as PodiumRank } : null,
    items[0] ? { entry: items[0], rank: 1 as PodiumRank } : null,
    items[2] ? { entry: items[2], rank: 3 as PodiumRank } : null,
  ].filter(Boolean) as Array<{ entry: LeaderboardEntry; rank: PodiumRank }>

  return (
    <div className="rounded-2xl bg-muted/25 px-6 pb-10 pt-6 sm:px-14">
      <div className="grid grid-cols-3 items-end gap-4 sm:gap-12">
        {ordered.map(({ entry, rank }) => (
          <PodiumColumn key={entry.user_id} entry={entry} rank={rank} />
        ))}
      </div>
    </div>
  )
})
