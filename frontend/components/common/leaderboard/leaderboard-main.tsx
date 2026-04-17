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
import { LoadingState } from "@/components/layout/loading"
import { cn } from "@/lib/utils"

/**
 * 排行榜主组件
 * 
 * 负责组装排行榜的各个子组件，包括领奖台、用户排名卡片和排名列表
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

  if (loading && items.length === 0) {
    return <LoadingState title="加载中" description="正在获取排行榜数据..." />
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-col gap-4 border-b border-dashed border-border/80 pb-5 md:flex-row md:items-end md:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">全局排行榜</h1>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-dashed gap-1.5 shadow-none">
                <CircleHelp className="size-4" />
                规则说明
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

          <Button variant="outline" size="icon" className="size-8 border-dashed shadow-none" onClick={refresh} aria-label="刷新排行榜">
            <RefreshCw className={cn("size-4", (loading || loadingMore || myRankLoading) && "animate-spin")} />
          </Button>
        </div>
      </div>

      <LeaderboardPodium items={items.slice(0, 3)} loading={loading} />

      <LeaderboardTable
        items={items}
        loading={loading || loadingMore || myRankLoading}
        currentUserId={myRank?.user.user_id}
        currentUserEntry={currentUserEntry}
        currentUserRank={myRank?.user.rank}
        onLoadMore={loadNextPage}
        hasMore={hasMore}
        startRank={1}
      />
    </div>
  )
}
