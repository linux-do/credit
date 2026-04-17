"use client"

import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Skeleton } from "@/components/ui/skeleton"
import { RankRowItem } from "./rank-row-item"
import type { LeaderboardEntry } from "@/lib/services/leaderboard"

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
  const rankedItems = React.useMemo(
    () =>
      items
        .map((entry, index) => ({
          entry,
          rank: startRank + index,
        }))
        .filter(({ entry }) => entry.user_id !== currentUserEntry?.user_id),
    [items, startRank, currentUserEntry?.user_id]
  )

  const virtualizer = useVirtualizer({
    count: rankedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 68,
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

  if (loading && items.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">完整榜单</h2>
        <div className="border border-dashed border-border/80">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[48px_minmax(0,1fr)_112px] items-center gap-3 border-b border-dashed border-border/70 px-4 py-4 last:border-b-0">
              <Skeleton className="h-4 w-10" />
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-18" />
                </div>
              </div>
              <Skeleton className="ml-auto h-5 w-16" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">完整榜单</h2>
        <div className="border border-dashed border-border/80 py-12 text-center text-muted-foreground">
          暂无排行数据
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">完整榜单</h2>

      <div className="border border-dashed border-border/80">
        <div className="grid grid-cols-[48px_minmax(0,1fr)_112px] items-center border-b border-dashed border-border/80 px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <div>排名</div>
          <div>用户</div>
          <div className="text-right">可用积分</div>
        </div>

        {currentUserEntry && currentUserRank && (
          <RankRowItem
            entry={currentUserEntry}
            rank={currentUserRank}
            isCurrentUser
            pinned
            metaLabel="我的位置"
          />
        )}

        <div ref={parentRef} className="h-[560px] overflow-auto">
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualItems.map((virtualRow) => {
              const { entry, rank } = rankedItems[virtualRow.index]
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
                    isCurrentUser={entry.user_id === currentUserId}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {loading && items.length > 0 && (
          <div className="border-t border-dashed border-border/70 py-3 text-center text-sm text-muted-foreground">
            正在加载更多排行...
          </div>
        )}
      </div>
    </section>
  )
})
