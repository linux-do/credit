"use client";

import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrendDirection } from "@/types/leaderboard";

interface TrendIndicatorProps {
  currentRank: number;
  previousRank?: number;
  showDelta?: boolean;
  className?: string;
}

function getTrendDirection(current: number, previous?: number): TrendDirection {
  if (previous === undefined || previous === current) return "same";
  return previous > current ? "up" : "down";
}

export function TrendIndicator({
  currentRank,
  previousRank,
  showDelta = true,
  className,
}: TrendIndicatorProps) {
  const direction = getTrendDirection(currentRank, previousRank);
  const delta =
    previousRank !== undefined ? Math.abs(previousRank - currentRank) : 0;

  if (direction === "same") {
    return (
      <span
        className={cn(
          "inline-flex items-center text-muted-foreground",
          className,
        )}
      >
        <Minus className="h-3 w-3" />
      </span>
    );
  }

  const isUp = direction === "up";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        isUp ? "text-green-500" : "text-red-500",
        className,
      )}
    >
      {isUp ? (
        <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowDown className="h-3 w-3" />
      )}
      {showDelta && delta > 0 && <span>{delta}</span>}
    </span>
  );
}
