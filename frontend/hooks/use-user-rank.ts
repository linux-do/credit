"use client";

import { useState, useEffect, useCallback } from "react";
import { LeaderboardService } from "@/lib/services/leaderboard";
import type {
  UserRankResponse,
  LeaderboardQueryParams,
} from "@/lib/services/leaderboard";

export function useUserRank(
  userId?: number,
  params?: Pick<LeaderboardQueryParams, "period" | "metric">,
) {
  const [data, setData] = useState<UserRankResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRank = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = userId
        ? await LeaderboardService.getUserRank(userId, params)
        : await LeaderboardService.getMyRank(params);
      setData(response);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, params]);

  useEffect(() => {
    fetchRank();
  }, [fetchRank]);

  return {
    data,
    loading,
    error,
    refresh: fetchRank,
  };
}
