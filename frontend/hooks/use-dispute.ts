"use client";

import * as React from "react";
import type { DisputeWithOrder, DisputeStatus } from "@/lib/services";
import { useUser } from "@/contexts/user-context";
import { toast } from "sonner";

const DISPUTE_PAGE_SIZE = 20;

/**
 * 争议数据获取 Hook
 * 用于获取争议数据
 *
 * @param fetchFn 获取争议数据的函数
 * @returns 争议数据
 */
interface UseDisputeDataProps {
  fetchFn: (params: {
    page: number;
    page_size: number;
    status: DisputeStatus;
  }) => Promise<{ total: number; disputes: DisputeWithOrder[] }>;
}

export const useDisputeData = ({ fetchFn }: UseDisputeDataProps) => {
  const { user } = useUser();
  const [disputes, setDisputes] = React.useState<{
    count: number;
    list: DisputeWithOrder[];
  }>({ count: 0, list: [] });
  const [loading, setLoading] = React.useState<boolean>(true);
  const fetchFnRef = React.useRef(fetchFn);

  React.useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const fetchData = React.useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const result = await fetchFnRef
        .current({
          page: 1,
          page_size: DISPUTE_PAGE_SIZE,
          status: "disputing",
        })
        .catch(() => ({ total: 0, disputes: [] }));

      setDisputes({
        count: result.total,
        list: result.disputes,
      });
    } catch (err) {
      toast.error("获取争议数据失败", {
        description: err instanceof Error ? err.message : "获取争议数据失败",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchFnRef.current({
        page: 1,
        page_size: DISPUTE_PAGE_SIZE,
        status: "disputing",
      });
      setDisputes({
        count: result.total,
        list: result.disputes,
      });
    } catch (err) {
      toast.error("刷新争议数据失败", {
        description: err instanceof Error ? err.message : "刷新争议数据失败",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return { disputes, loading, handleRefresh, refetchData: fetchData };
};
