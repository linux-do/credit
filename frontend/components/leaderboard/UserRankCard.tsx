"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendIndicator } from "./TrendIndicator";
import { formatScore } from "@/lib/format";
import type { UserRankResponse } from "@/lib/services/leaderboard";

interface UserRankCardProps {
  data: UserRankResponse | null;
  loading?: boolean;
  className?: string;
}

export function UserRankCard({ data, loading, className }: UserRankCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src="" alt="Your avatar" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {data.user.rank}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">我的排名</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">#{data.user.rank}</span>
              <TrendIndicator
                currentRank={data.user.rank}
                previousRank={undefined}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">积分</p>
            <p className="text-xl font-semibold">
              {formatScore(data.user.score)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
