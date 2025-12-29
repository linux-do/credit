"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LeaderboardService } from "@/lib/services/leaderboard";
import type {
  LeaderboardListResponse,
  LeaderboardQueryParams,
  LeaderboardMetadata,
} from "@/lib/services/leaderboard";

export function useLeaderboard(initialParams?: LeaderboardQueryParams) {
  const [data, setData] = useState<LeaderboardListResponse | null>(null);
  const [metadata, setMetadata] = useState<LeaderboardMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<LeaderboardQueryParams>(
    initialParams ?? {},
  );

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (queryParams: LeaderboardQueryParams) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await LeaderboardService.getList(queryParams);
      setData(response);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

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
    fetchData(params);
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [params, fetchData]);

  const updateParams = useCallback(
    (newParams: Partial<LeaderboardQueryParams>) => {
      setParams((prev) => ({ ...prev, ...newParams }));
    },
    [],
  );

  const refresh = useCallback(() => {
    fetchData(params);
  }, [fetchData, params]);

  return {
    data,
    metadata,
    loading,
    error,
    params,
    updateParams,
    refresh,
  };
}
