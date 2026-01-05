"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { UserRankResponse } from "@/lib/services/leaderboard";

interface UserRankCardProps {
  data: UserRankResponse | null;
  loading?: boolean;
  className?: string;
}

export const UserRankCard = React.memo(function UserRankCard({
  data,
  loading,
  className,
}: UserRankCardProps) {
  if (loading) {
    return (
      <div className={cn("bg-blue-100 rounded-xl p-4", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24 bg-blue-200" />
          <Skeleton className="h-5 w-8 bg-blue-200" />
          <Skeleton className="h-6 w-16 bg-blue-200" />
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const balance = parseFloat(data.user.available_balance).toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("bg-blue-100 rounded-xl px-5 py-4", className)}
    >
      <div className="flex items-center justify-between">
        {/* 排名 */}
        <div className="flex items-center gap-2">
          <span className="text-blue-600 font-medium">排名:</span>
          <span className="text-blue-900 font-bold text-lg tabular-nums">
            {data.user.rank.toLocaleString()}
          </span>
        </div>

        {/* 您 */}
        <span className="text-blue-600 font-medium">您</span>

        {/* 余额 */}
        <span className="text-blue-900 font-bold text-lg tabular-nums">
          {balance}
        </span>
      </div>
    </motion.div>
  );
});
