"use client";

import * as React from "react";
import { LeaderboardService } from "@/lib/services/leaderboard";
import type {
  LeaderboardListResponse,
  LeaderboardListRequest,
  LeaderboardEntry,
  UserRankResponse,
} from "@/lib/services/leaderboard";

export const useLeaderboard = () => {
  const [data, setData] = React.useState<LeaderboardListResponse | null>(null);
  const [allItems, setAllItems] = React.useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = React.useState<UserRankResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [myRankLoading, setMyRankLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const currentPageRef = React.useRef(1);

  const fetchData = React.useCallback(
    async (
      queryParams: LeaderboardListRequest,
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

  const fetchMyRank = React.useCallback(
    async (ignore?: { current: boolean }) => {
      setMyRankLoading(true);
      try {
        const response = await LeaderboardService.getMyRank();
        if (!ignore?.current) {
          setMyRank(response);
        }
      } catch (err) {
        if (!ignore?.current) {
          console.error("Failed to fetch my rank:", err);
          setMyRank(null);
        }
      } finally {
        if (!ignore?.current) {
          setMyRankLoading(false);
        }
      }
    },
    [],
  );

  React.useEffect(() => {
    const ignore = { current: false };
    fetchData({ page: 1, page_size: 50 }, false, ignore);
    fetchMyRank(ignore);
    return () => {
      ignore.current = true;
    };
  }, [fetchData, fetchMyRank]);

  const loadNextPage = React.useCallback(() => {
    if (
      data &&
      currentPageRef.current * data.page_size < data.total &&
      !loadingMore
    ) {
      const nextPage = currentPageRef.current + 1;
      fetchData({ page: nextPage, page_size: data.page_size }, true);
    }
  }, [data, loadingMore, fetchData]);

  const refresh = React.useCallback(() => {
    fetchData({ page: 1, page_size: 50 }, false);
    fetchMyRank();
  }, [fetchData, fetchMyRank]);

  const hasMore = data
    ? currentPageRef.current * data.page_size < data.total
    : false;

  return {
    data,
    items: allItems,
    myRank,
    loading,
    loadingMore,
    myRankLoading,
    error,
    hasMore,
    loadNextPage,
    refresh,
  };
};
