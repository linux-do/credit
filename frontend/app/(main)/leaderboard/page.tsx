"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { LeaderboardPodium } from "@/components/leaderboard/leaderboard-podium";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { UserRankCard } from "@/components/leaderboard/user-rank-card";

export default function LeaderboardPage() {
  const {
    items,
    myRank,
    loading,
    loadingMore,
    myRankLoading,
    hasMore,
    loadNextPage,
  } = useLeaderboard();

  return (
    <div className="container max-w-6xl py-8">
      {/* 页头 */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold">全局排行榜</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-primary gap-1">
              <HelpCircle className="h-4 w-4" />
              排行榜是如何运作的?
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>排行榜规则</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>排行榜根据用户的可用余额进行排名。</p>
              <p>
                <strong>排名指标：</strong>
                按用户当前可用余额（available_balance）从高到低排序。
              </p>
              <p>
                <strong>实时更新：</strong>
                排行榜数据实时更新，反映用户当前的余额状态。
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 领奖台 */}
      <LeaderboardPodium items={items.slice(0, 3)} loading={loading} />

      {/* 当前用户排名 */}
      <UserRankCard data={myRank} loading={myRankLoading} className="my-6" />

      {/* 排名列表 */}
      <LeaderboardTable
        items={items.slice(3)}
        loading={loading || loadingMore}
        currentUserId={myRank?.user.user_id}
        onLoadMore={loadNextPage}
        hasMore={hasMore}
        startRank={4}
      />
    </div>
  );
}
