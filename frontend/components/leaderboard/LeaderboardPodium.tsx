"use client";

import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { PodiumItem } from "./PodiumItem";
import type { LeaderboardEntry } from "@/lib/services/leaderboard";

interface LeaderboardPodiumProps {
  items: LeaderboardEntry[];
  loading?: boolean;
}

export function LeaderboardPodium({ items, loading }: LeaderboardPodiumProps) {
  if (loading) {
    return (
      <div className="flex items-end justify-center gap-6 py-12 px-4">
        {[2, 1, 3].map((rank) => (
          <div
            key={rank}
            className={`flex flex-col items-center gap-3 ${rank === 1 ? "order-2" : rank === 2 ? "order-1" : "order-3"}`}
          >
            <Skeleton
              className={`rounded-full ${rank === 1 ? "h-24 w-24" : rank === 2 ? "h-20 w-20" : "h-18 w-18"}`}
            />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton
              className={`w-28 rounded-t-xl ${rank === 1 ? "h-32" : rank === 2 ? "h-24" : "h-20"}`}
            />
          </div>
        ))}
      </div>
    );
  }

  const top3 = items.slice(0, 3);
  if (top3.length === 0) {
    return (
      <div className="py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-muted-foreground"
        >
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-lg font-medium">暂无排行数据</p>
          <p className="text-sm mt-1">快来成为第一个上榜的用户吧！</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative py-8 px-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-radial from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* 领奖台区域 */}
      <div className="relative flex items-end justify-center gap-4 md:gap-6 pt-8">
        {top3.map((entry, index) => (
          <PodiumItem
            key={entry.user_id}
            entry={entry}
            rank={(index + 1) as 1 | 2 | 3}
            delay={index * 0.15}
          />
        ))}
      </div>

      {/* 底部连接线 */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-0 h-1 bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent origin-center"
      />
    </div>
  );
}
