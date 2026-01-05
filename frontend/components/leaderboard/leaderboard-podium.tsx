"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/services/leaderboard";
import { Crown } from "lucide-react";

interface LeaderboardPodiumProps {
  items: LeaderboardEntry[];
  loading?: boolean;
}

function PodiumEntry({
  entry,
  rank,
  delay = 0,
}: {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
  delay?: number;
}) {
  const styles = {
    1: {
      height: 160,
      gradient: "from-yellow-400/20 to-yellow-600/5",
      border: "border-yellow-400/50",
      text: "text-yellow-600 dark:text-yellow-400",
    },
    2: {
      height: 120,
      gradient: "from-slate-300/20 to-slate-500/5",
      border: "border-slate-300/50",
      text: "text-slate-600 dark:text-slate-400",
    },
    3: {
      height: 90,
      gradient: "from-amber-700/20 to-amber-900/5",
      border: "border-amber-700/50",
      text: "text-amber-700 dark:text-amber-600",
    },
  }[rank];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-end z-10",
        rank === 1 ? "order-2" : rank === 2 ? "order-1" : "order-3",
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.3, duration: 0.5 }}
        className="flex flex-col items-center mb-3 relative"
      >
        {rank === 1 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.5, type: "spring" }}
            className="absolute -top-10 text-yellow-500 drop-shadow-lg"
          >
            <Crown size={40} fill="currentColor" />
          </motion.div>
        )}

        <div className="relative group">
          <Avatar
            className={cn(
              "border-4 shadow-xl transition-transform duration-300 group-hover:scale-105",
              rank === 1
                ? "h-24 w-24 border-yellow-400"
                : rank === 2
                  ? "h-20 w-20 border-slate-300"
                  : "h-16 w-16 border-amber-700",
            )}
          >
            <AvatarImage src={entry.avatar_url} alt={entry.username} />
            <AvatarFallback className="font-bold">
              {entry.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div
            className={cn(
              "absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-6 h-6 rounded-full border-2 text-[10px] font-bold bg-background",
              rank === 1
                ? "border-yellow-400 text-yellow-600"
                : rank === 2
                  ? "border-slate-300 text-slate-600"
                  : "border-amber-700 text-amber-700",
            )}
          >
            {rank}
          </div>
        </div>

        <div className="text-center mt-4 space-y-1">
          <p className="font-bold text-sm max-w-[100px] truncate leading-tight">
            {entry.username}
          </p>
          <p
            className={cn(
              "text-xs font-mono font-bold opacity-80",
              styles.text,
            )}
          >
            {parseFloat(entry.available_balance).toLocaleString()}
          </p>
        </div>
      </motion.div>

      {/* Podium Box */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: styles.height }}
        transition={{ delay, duration: 0.6, type: "spring", stiffness: 60 }}
        className={cn(
          "w-24 md:w-32 rounded-t-lg relative overflow-hidden backdrop-blur-sm border-x border-t",
          styles.gradient,
          styles.border,
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-b opacity-30",
            styles.gradient,
          )}
        />
        <div className="absolute top-0 w-full h-1 bg-white/20" />
      </motion.div>
    </div>
  );
}

export const LeaderboardPodium = React.memo(function LeaderboardPodium({
  items,
  loading,
}: LeaderboardPodiumProps) {
  if (loading) {
    return (
      <div className="bg-gradient-to-b from-muted/50 to-muted/20 rounded-3xl p-8 border border-muted/50">
        <div className="flex items-end justify-center gap-4 py-8 min-h-[300px]">
          {[2, 1, 3].map((rank) => (
            <div
              key={rank}
              className={cn(
                "flex flex-col items-center gap-4",
                rank === 1 ? "order-2" : rank === 2 ? "order-1" : "order-3",
              )}
            >
              <Skeleton
                className={cn(
                  "rounded-full",
                  rank === 1 ? "h-24 w-24" : "h-16 w-16",
                )}
              />
              <Skeleton className="h-4 w-20" />
              <Skeleton
                className={cn(
                  "w-24 md:w-32 rounded-t-lg opacity-30",
                  rank === 1 ? "h-40" : rank === 2 ? "h-32" : "h-24",
                )}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const top3 = items.slice(0, 3);
  if (top3.length === 0) {
    return (
      <div className="bg-gradient-to-b from-muted/50 to-muted/20 rounded-3xl py-20 text-center border border-muted/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-muted-foreground"
        >
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-lg font-medium">暂无排行数据</p>
          <p className="text-sm mt-1">快来成为第一个上榜的用户吧！</p>
        </motion.div>
      </div>
    );
  }

  const [first, second, third] = top3;

  return (
    <div className="bg-gradient-to-b from-muted/50 to-muted/20 rounded-3xl p-8 border border-muted/50 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-primary/5 to-transparent blur-3xl" />

      <div className="flex items-end justify-center gap-3 md:gap-8 relative z-10 pt-10">
        {/* Staggered reveal: 3rd (0s) -> 2nd (0.2s) -> 1st (0.4s) */}
        {third && <PodiumEntry entry={third} rank={3} delay={0} />}
        {second && <PodiumEntry entry={second} rank={2} delay={0.2} />}
        {first && <PodiumEntry entry={first} rank={1} delay={0.4} />}
      </div>
    </div>
  );
});
