"use client";

import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { TrendIndicator } from "./TrendIndicator";
import type { LeaderboardEntry } from "@/lib/services/leaderboard";

interface RankRowItemProps {
  entry: LeaderboardEntry;
  index: number;
  isCurrentUser?: boolean;
}

export function RankRowItem({ entry, index, isCurrentUser }: RankRowItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg transition-colors",
        isCurrentUser
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-muted/50",
      )}
    >
      <div className="w-8 text-center">
        <span
          className={cn("font-bold text-lg", entry.rank <= 3 && "text-primary")}
        >
          {entry.rank}
        </span>
      </div>

      <Avatar className="h-10 w-10">
        <AvatarImage src={entry.avatar_url} alt={entry.username} />
        <AvatarFallback>
          {entry.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{entry.username}</p>
      </div>

      <div className="flex items-center gap-2">
        <TrendIndicator
          currentRank={entry.rank}
          previousRank={entry.previous_rank}
        />
        <span className="font-semibold tabular-nums">
          {parseFloat(entry.score).toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
}
