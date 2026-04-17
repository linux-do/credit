"use client"

import * as React from "react"
import { CircleHelp, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useUser } from "@/contexts/user-context"
import { useLeaderboard } from "@/hooks/use-leaderboard"
import { LeaderboardPodium } from "@/components/common/leaderboard/leaderboard-podium"
import { LeaderboardTable } from "@/components/common/leaderboard/leaderboard-table"
import { cn } from "@/lib/utils"

/**
 * 排行榜主组件
 */
export function LeaderboardMain() {
  const { user } = useUser()
  const {
    items,
    myRank,
    loading,
    loadingMore,
    myRankLoading,
    hasMore,
    loadNextPage,
    refresh,
  } = useLeaderboard()
  const isInitialLoading = loading && items.length === 0

  const currentUserEntry = React.useMemo(() => {
    if (!myRank?.user) return undefined

    const matchedEntry = items.find((item) => item.user_id === myRank.user.user_id)
    if (matchedEntry) return matchedEntry

    if (!user) return undefined

    return {
      user_id: myRank.user.user_id,
      username: user.nickname || user.username,
      avatar_url: user.avatar_url,
      available_balance: myRank.user.available_balance,
    }
  }, [items, myRank, user])

  return (
    <div className="py-6 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">全局排行榜</h1>

        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
                <CircleHelp className="size-4" />
                规则
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>排行榜如何运作</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>排行榜按可用积分实时排序，数据会定期刷新。</p>
                <p>参与社区活动、进行积分流转，都会影响可用积分与当前排名。</p>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={refresh} aria-label="刷新排行榜">
            <RefreshCw className={cn("size-4", (loading || loadingMore || myRankLoading) && "animate-spin")} />
          </Button>
        </div>
      </div>

      <LeaderboardPodium
        items={items.slice(0, 3)}
        loading={isInitialLoading}
      />

      <section>
        <h2 className="font-semibold mb-4">完整榜单</h2>
        <LeaderboardTable
          items={items}
          loading={isInitialLoading}
          currentUserId={myRank?.user.user_id}
          currentUserEntry={currentUserEntry}
          currentUserRank={myRank?.user.rank}
          onLoadMore={loadNextPage}
          hasMore={hasMore}
          startRank={1}
        />
      </section>
    </div>
  )
}
