"use client"

import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RankRowItem } from "./rank-row-item"
import type { LeaderboardEntry } from "@/lib/services/leaderboard"

const leaderboardTableColumns = "grid-cols-[72px_minmax(0,1fr)_132px] sm:grid-cols-[88px_minmax(0,1fr)_152px]"
const leaderboardRowHeight = 60

interface LeaderboardTableProps {
  items: LeaderboardEntry[]
  loading?: boolean
  currentUserId?: number
  currentUserEntry?: LeaderboardEntry
  currentUserRank?: number
  onLoadMore?: () => void
  hasMore?: boolean
  startRank?: number
}

export const LeaderboardTable = React.memo(function LeaderboardTable({
  items,
  loading,
  currentUserId,
  currentUserEntry,
  currentUserRank,
  onLoadMore,
  hasMore,
  startRank = 1,
}: LeaderboardTableProps) {
  const parentRef = React.useRef<HTMLDivElement>(null)

  const maxBalance = React.useMemo(() => {
    if (items.length === 0) return 1
    return Math.max(...items.map(item => parseFloat(item.available_balance))) || 1
  }, [items])

  const rankedItems = React.useMemo(
    () =>
      items
        .map((entry, index) => ({
          entry,
          rank: startRank + index,
          percentage: (parseFloat(entry.available_balance) / maxBalance) * 100,
        }))
        .filter(({ entry }) => entry.user_id !== currentUserEntry?.user_id),
    [items, startRank, currentUserEntry?.user_id, maxBalance]
  )

  const virtualizer = useVirtualizer({
    count: rankedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => leaderboardRowHeight,
    overscan: 6,
    useFlushSync: false,
  })

  const virtualItems = virtualizer.getVirtualItems()

  React.useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1]
    if (!lastItem) return
    if (lastItem.index >= rankedItems.length - 1 && hasMore && !loading && onLoadMore) {
      onLoadMore()
    }
  }, [virtualItems, rankedItems.length, hasMore, loading, onLoadMore])

  const currentUserPercentage = currentUserEntry
    ? (parseFloat(currentUserEntry.available_balance) / maxBalance) * 100
    : 0

  if (loading && items.length === 0) {
    return (
      <div>
        <div className={`grid ${leaderboardTableColumns} items-center px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground`}>
          <div>排名</div>
          <div>用户</div>
          <div className="text-right">可用积分</div>
        </div>
        <div className="mt-1 overflow-hidden rounded-xl bg-linear-to-b from-muted/30 to-transparent">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`grid h-[60px] ${leaderboardTableColumns} items-center gap-3 px-3`}>
              <Skeleton className="h-4 w-8" />
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="ml-auto h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return <div className="py-16 text-center text-muted-foreground">暂无排行数据</div>
  }

  return (
    <div>
      {/* 列头 */}
      <div className={`grid ${leaderboardTableColumns} items-center px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground`}>
        <div>排名</div>
        <div>用户</div>
        <div className="text-right">可用积分</div>
      </div>

      {/* 当前用户置顶行 */}
      {currentUserEntry && currentUserRank && (
        <div className="mt-1 overflow-hidden rounded-xl bg-primary/[0.04]">
          <RankRowItem
            entry={currentUserEntry}
            rank={currentUserRank}
            percentage={currentUserPercentage}
            isCurrentUser
            pinned
            metaLabel="我的位置"
          />
        </div>
      )}

      {/* 榜单主体 — 从 muted 过渡到页面背景色 */}
      <div className="relative mt-2">
        <div className="overflow-hidden rounded-xl bg-linear-to-b from-muted/30 via-muted/10 to-transparent">
          <ScrollArea className="h-[440px] sm:h-[480px]" viewportRef={parentRef}>
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualItems.map((virtualRow) => {
                const { entry, rank, percentage } = rankedItems[virtualRow.index]
                return (
                  <div
                    key={entry.user_id}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <RankRowItem
                      entry={entry}
                      rank={rank}
                      percentage={percentage}
                      isCurrentUser={entry.user_id === currentUserId}
                    />
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {loading && items.length > 0 && (
        <div className="py-3 text-center text-sm text-muted-foreground">
          正在加载更多...
        </div>
      )}
    </div>
  )
})
