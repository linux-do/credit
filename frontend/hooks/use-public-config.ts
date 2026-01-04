import { useState, useEffect } from "react";
import { ConfigService, PublicConfigResponse } from "@/lib/services";

/* 全局缓存 */
let cachedConfig: PublicConfigResponse | null = null;
let cachePromise: Promise<PublicConfigResponse> | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * 获取公共配置（带缓存）
 *
 * @example
 * ```tsx
 * const { config, loading, error } = usePublicConfig()
 * ```
 */
export function usePublicConfig() {
  const [config, setConfig] = useState<PublicConfigResponse | null>(
    cachedConfig
  );
  const [loading, setLoading] = useState(!cachedConfig);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchConfig = async () => {
      const now = Date.now();

      if (cachedConfig && now - cacheTime < CACHE_DURATION) {
        if (mounted) {
          setConfig(cachedConfig);
          setLoading(false);
        }
        return;
      }

      if (!cachePromise) {
        cachePromise = ConfigService.getPublicConfig();
      }

      try {
        const data = await cachePromise;
        if (mounted) {
          cachedConfig = data;
          cacheTime = now;
          setConfig(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error("获取配置失败"));
        }
      } finally {
        cachePromise = null;
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchConfig();

    return () => {
      mounted = false;
    };
  }, []);

  return { config, loading, error };
}
