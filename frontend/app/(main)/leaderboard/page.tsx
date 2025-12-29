"use client";

import { useCallback, useMemo } from "react";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { useUserRank } from "@/hooks/use-user-rank";
import {
  LeaderboardPodium,
  LeaderboardTable,
  FilterSidebar,
  UserRankCard,
} from "@/components/leaderboard";
import type { FilterParams } from "@/types/leaderboard";
import type { PeriodType, MetricType } from "@/lib/services/leaderboard";

export default function LeaderboardPage() {
  const { data, metadata, loading, params, updateParams } = useLeaderboard({
    period: "all_time",
    metric: "volume_amount",
  });

  const { data: myRank, loading: rankLoading } = useUserRank(undefined, {
    period: params.period,
    metric: params.metric,
  });

  const filters: FilterParams = useMemo(
    () => ({
      period: (params.period ?? "all_time") as PeriodType,
      metric: (params.metric ?? "volume_amount") as MetricType,
    }),
    [params.period, params.metric],
  );

  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterParams>) => {
      updateParams(newFilters);
    },
    [updateParams],
  );

  const handleLoadMore = useCallback(() => {
    if (data && data.page * data.page_size < data.total) {
      updateParams({ page: (params.page ?? 1) + 1 });
    }
  }, [data, params.page, updateParams]);

  const hasMore = data ? data.page * data.page_size < data.total : false;
  const items = data?.items ?? [];

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          排行榜
        </h1>
        <p className="text-muted-foreground mt-2">
          查看 LINUX DO Credit 平台用户积分排行榜
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <LeaderboardPodium items={items.slice(0, 3)} loading={loading} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>全部排名</CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardTable
                items={items.slice(3)}
                loading={loading}
                currentUserId={myRank?.user.user_id}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>筛选条件</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterSidebar
                filters={filters}
                metadata={metadata}
                onFilterChange={handleFilterChange}
              />
            </CardContent>
          </Card>

          <UserRankCard data={myRank} loading={rankLoading} />
        </div>
      </div>
    </div>
  );
}
