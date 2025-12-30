export type PeriodType = "day" | "week" | "month" | "all_time";
export type MetricType =
  | "receive_amount"
  | "payment_amount"
  | "transfer_in_amount"
  | "transfer_out_amount"
  | "volume_amount"
  | "net_amount";

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  avatar_url: string;
  score: string;
  previous_rank?: number;
}

export interface LeaderboardPeriod {
  type: PeriodType;
  start: string;
  end: string;
}

export interface LeaderboardListResponse {
  period: LeaderboardPeriod;
  metric: MetricType;
  snapshot_at: string;
  page: number;
  page_size: number;
  total: number;
  items: LeaderboardEntry[];
}

export interface UserRankResponse {
  period: LeaderboardPeriod;
  metric: MetricType;
  snapshot_at: string;
  user: {
    user_id: number;
    rank: number;
    score: string;
  };
}

export interface LeaderboardMetadata {
  periods: PeriodType[];
  metrics: { key: MetricType; name: string }[];
  timezone: string;
  defaults: {
    period: PeriodType;
    metric: MetricType;
    page_size: number;
  };
}

export interface LeaderboardQueryParams {
  period?: PeriodType;
  date?: string;
  metric?: MetricType;
  page?: number;
  page_size?: number;
}
