"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LeaderboardService } from "@/lib/services/leaderboard";
import type {
  LeaderboardListResponse,
  LeaderboardQueryParams,
  LeaderboardMetadata,
  LeaderboardEntry,
  UserRankResponse,
} from "@/lib/services/leaderboard";

export function useLeaderboard(initialParams?: LeaderboardQueryParams) {
  const [data, setData] = useState<LeaderboardListResponse | null>(null);
  const [allItems, setAllItems] = useState<LeaderboardEntry[]>([]);
  const [metadata, setMetadata] = useState<LeaderboardMetadata | null>(null);
  const [myRank, setMyRank] = useState<UserRankResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [myRankLoading, setMyRankLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<LeaderboardQueryParams>(
    initialParams ?? {},
  );

  const currentPageRef = useRef(1);

  const fetchData = useCallback(
    async (
      queryParams: LeaderboardQueryParams,
      append = false,
      ignore?: { current: boolean },
    ) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setAllItems([]);
        currentPageRef.current = 1;
      }
      setError(null);

      try {
        const response = await LeaderboardService.getList(queryParams);

        if (ignore?.current) return;

        setData(response);
        if (append) {
          setAllItems((prev) => [...prev, ...response.items]);
        } else {
          setAllItems(response.items);
        }
        currentPageRef.current = response.page;
      } catch (err) {
        if (ignore?.current) return;
        if (err instanceof Error) {
          setError(err);
        }
      } finally {
        if (!ignore?.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [],
  );

  const fetchMyRank = useCallback(
    async (
      queryParams: Pick<LeaderboardQueryParams, "period" | "metric">,
      ignore?: { current: boolean },
    ) => {
      setMyRankLoading(true);
      try {
        const response = await LeaderboardService.getMyRank(queryParams);
        if (!ignore?.current) {
          setMyRank(response);
        }
      } catch (err) {
        if (!ignore?.current) {
          console.error("Failed to fetch my rank:", err);
        }
      } finally {
        if (!ignore?.current) {
          setMyRankLoading(false);
        }
      }
    },
    [],
  );

  const fetchMetadata = useCallback(async () => {
    try {
      const response = await LeaderboardService.getMetadata();
      setMetadata(response);
    } catch (err) {
      console.error("Failed to fetch leaderboard metadata:", err);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    const ignore = { current: false };
    const queryParams = { period: params.period, metric: params.metric };
    fetchData(queryParams, false, ignore);
    fetchMyRank(queryParams, ignore);
    return () => {
      ignore.current = true;
    };
  }, [params.period, params.metric, fetchData, fetchMyRank]);

  const loadNextPage = useCallback(() => {
    if (
      data &&
      currentPageRef.current * data.page_size < data.total &&
      !loadingMore
    ) {
      const nextPage = currentPageRef.current + 1;
      fetchData({ ...params, page: nextPage }, true);
    }
  }, [data, params, loadingMore, fetchData]);

  const updateParams = useCallback(
    (newParams: Partial<LeaderboardQueryParams>) => {
      if ("page" in newParams) {
        delete newParams.page;
      }
      setParams((prev) => ({ ...prev, ...newParams }));
    },
    [],
  );

  const refresh = useCallback(() => {
    const queryParams = { period: params.period, metric: params.metric };
    fetchData(params, false);
    fetchMyRank(queryParams);
  }, [fetchData, fetchMyRank, params]);

  const hasMore = data
    ? currentPageRef.current * data.page_size < data.total
    : false;

  return {
    data,
    items: allItems,
    metadata,
    myRank,
    loading,
    loadingMore,
    myRankLoading,
    error,
    params,
    hasMore,
    updateParams,
    loadNextPage,
    refresh,
  };
}
