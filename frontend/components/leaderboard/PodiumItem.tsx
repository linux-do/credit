"use client";

import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { TrendIndicator } from "./TrendIndicator";
import type { LeaderboardEntry } from "@/lib/services/leaderboard";

interface PodiumItemProps {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
  delay?: number;
}

const podiumConfig = {
  1: {
    height: "h-32",
    avatarSize: "h-24 w-24",
    glowColor: "shadow-[0_0_40px_rgba(251,191,36,0.4)]",
    ringColor: "ring-yellow-400/80",
    gradientFrom: "from-yellow-500",
    gradientVia: "via-yellow-400",
    gradientTo: "to-amber-500",
    bgGlow:
      "bg-gradient-to-t from-yellow-500/20 via-yellow-400/10 to-transparent",
    order: "order-2",
    labelBg: "bg-gradient-to-r from-yellow-500 to-amber-500",
  },
  2: {
    height: "h-24",
    avatarSize: "h-20 w-20",
    glowColor: "shadow-[0_0_30px_rgba(156,163,175,0.3)]",
    ringColor: "ring-gray-300/80",
    gradientFrom: "from-gray-400",
    gradientVia: "via-gray-300",
    gradientTo: "to-slate-400",
    bgGlow: "bg-gradient-to-t from-gray-400/20 via-gray-300/10 to-transparent",
    order: "order-1",
    labelBg: "bg-gradient-to-r from-gray-400 to-slate-400",
  },
  3: {
    height: "h-20",
    avatarSize: "h-18 w-18",
    glowColor: "shadow-[0_0_30px_rgba(180,83,9,0.3)]",
    ringColor: "ring-amber-600/80",
    gradientFrom: "from-amber-700",
    gradientVia: "via-amber-600",
    gradientTo: "to-orange-700",
    bgGlow:
      "bg-gradient-to-t from-amber-600/20 via-amber-500/10 to-transparent",
    order: "order-3",
    labelBg: "bg-gradient-to-r from-amber-600 to-orange-600",
  },
};

function Crown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 18L5 8L9.5 11L12 5L14.5 11L19 8L21 18H3Z"
        fill="url(#crownGradient)"
        stroke="url(#crownStroke)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="5" cy="7" r="1.5" fill="#FCD34D" />
      <circle cx="12" cy="4" r="1.5" fill="#FBBF24" />
      <circle cx="19" cy="7" r="1.5" fill="#FCD34D" />
      <defs>
        <linearGradient id="crownGradient" x1="3" y1="5" x2="21" y2="18">
          <stop stopColor="#FDE047" />
          <stop offset="0.5" stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="crownStroke" x1="3" y1="5" x2="21" y2="18">
          <stop stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function RankBadge({ rank }: { rank: 1 | 2 | 3 }) {
  const config = podiumConfig[rank];
  const labels = { 1: "1st", 2: "2nd", 3: "3rd" };

  return (
    <span
      className={cn(
        "absolute -bottom-2 left-1/2 -translate-x-1/2 z-10",
        "px-2.5 py-0.5 rounded-full text-xs font-bold text-white",
        "shadow-lg",
        config.labelBg,
      )}
    >
      {labels[rank]}
    </span>
  );
}

export function PodiumItem({ entry, rank, delay = 0 }: PodiumItemProps) {
  const config = podiumConfig[rank];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay,
        type: "spring",
        stiffness: 100,
      }}
      className={cn(
        "flex flex-col items-center relative",
        config.order,
        rank === 1 && "z-10",
      )}
    >
      {/* 背景光晕 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: delay + 0.2 }}
        className={cn("absolute -inset-4 rounded-full blur-2xl", config.bgGlow)}
      />

      {/* 王冠(仅第一名) */}
      {rank === 1 && (
        <motion.div
          initial={{ opacity: 0, y: -10, rotate: -10 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.5, delay: delay + 0.3 }}
          className="absolute -top-8 z-20"
        >
          <Crown className="w-10 h-10 drop-shadow-lg" />
        </motion.div>
      )}

      {/* 头像区域 */}
      <div className="relative mb-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.5,
            delay: delay + 0.1,
            type: "spring",
            stiffness: 200,
          }}
          className="relative"
        >
          <Avatar
            className={cn(
              "border-4 border-background ring-4",
              config.avatarSize,
              config.glowColor,
              config.ringColor,
            )}
          >
            <AvatarImage src={entry.avatar_url} alt={entry.username} />
            <AvatarFallback className="text-lg font-bold bg-muted">
              {entry.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <RankBadge rank={rank} />
        </motion.div>
      </div>

      {/* 用户信息 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: delay + 0.3 }}
        className="text-center mb-2 relative z-10"
      >
        <p className="font-bold text-sm truncate max-w-24">{entry.username}</p>
        <div className="flex items-center justify-center gap-1 mt-0.5">
          <span className="text-sm font-semibold text-muted-foreground">
            {parseFloat(entry.score).toLocaleString()}
          </span>
          <TrendIndicator
            currentRank={entry.rank}
            previousRank={entry.previous_rank}
            showDelta={false}
          />
        </div>
      </motion.div>

      {/* 领奖台底座 */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        transition={{
          duration: 0.7,
          delay: delay + 0.2,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative w-28 overflow-hidden"
      >
        <div
          className={cn(
            "w-full rounded-t-xl relative",
            config.height,
            "bg-gradient-to-b",
            config.gradientFrom,
            config.gradientVia,
            config.gradientTo,
          )}
        >
          {/* 高光效果 */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent rounded-t-xl" />
          {/* 底部反光 */}
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/20 to-transparent" />
          {/* 立体边缘 */}
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </motion.div>
    </motion.div>
  );
}
