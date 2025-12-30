import type { MetricType, PeriodType } from "@/lib/services/leaderboard/types";

export interface FilterParams {
  period: PeriodType;
  metric: MetricType;
}

export type TrendDirection = "up" | "down" | "same";
