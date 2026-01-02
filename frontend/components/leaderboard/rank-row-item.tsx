"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/services/leaderboard";

interface RankRowItemProps {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser?: boolean;
}

export const RankRowItem = React.memo(function RankRowItem({
  entry,
  rank,
  isCurrentUser,
}: RankRowItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: (rank % 10) * 0.03 }}
      className={cn(
        "flex items-center gap-4 py-3 px-4 rounded-xl transition-colors",
        isCurrentUser ? "bg-blue-100" : "hover:bg-muted/50",
      )}
    >
      {/* 排名 */}
      <span className="w-10 text-muted-foreground font-medium tabular-nums">
        #{rank}
      </span>

      {/* 头像 */}
      <Avatar className="h-9 w-9">
        <AvatarImage src={entry.avatar_url} alt={entry.username} />
        <AvatarFallback className="text-xs">
          {entry.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* 用户名 */}
      <span className="flex-1 min-w-0 font-medium truncate">
        {entry.username}
      </span>

      {/* 余额 */}
      <span className="font-semibold tabular-nums">
        {parseFloat(entry.available_balance).toLocaleString()}
      </span>
    </motion.div>
  );
});
