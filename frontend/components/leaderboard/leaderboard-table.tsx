"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Skeleton } from "@/components/ui/skeleton";
import { RankRowItem } from "./rank-row-item";
import type { LeaderboardEntry } from "@/lib/services/leaderboard";

interface LeaderboardTableProps {
  items: LeaderboardEntry[];
  loading?: boolean;
  currentUserId?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  startRank?: number;
}

export const LeaderboardTable = React.memo(function LeaderboardTable({
  items,
  loading,
  currentUserId,
  onLoadMore,
  hasMore,
  startRank = 1,
}: LeaderboardTableProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const lastItem = virtualItems[virtualItems.length - 1];
  const lastItemIndex = lastItem?.index ?? -1;

  React.useEffect(() => {
    if (
      lastItemIndex >= items.length - 1 &&
      hasMore &&
      !loading &&
      onLoadMore
    ) {
      onLoadMore();
    }
  }, [lastItemIndex, items.length, hasMore, loading, onLoadMore]);

  if (loading && items.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        暂无排行数据
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const entry = items[virtualRow.index];
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
                rank={startRank + virtualRow.index}
                isCurrentUser={entry.user_id === currentUserId}
              />
            </div>
          );
        })}
      </div>
      {loading && items.length > 0 && (
        <div className="py-4 text-center text-muted-foreground">加载中...</div>
      )}
    </div>
  );
});
