"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterParams } from "@/types/leaderboard";
import type {
  PeriodType,
  MetricType,
  LeaderboardMetadata,
} from "@/lib/services/leaderboard";

interface FilterSidebarProps {
  filters: FilterParams;
  metadata: LeaderboardMetadata | null;
  onFilterChange: (filters: Partial<FilterParams>) => void;
}

const periodLabels: Record<PeriodType, string> = {
  day: "今日",
  week: "本周",
  month: "本月",
  all_time: "全部时间",
};

export function FilterSidebar({
  filters,
  metadata,
  onFilterChange,
}: FilterSidebarProps) {
  const periods = metadata?.periods ?? ["day", "week", "month", "all_time"];
  const metrics = metadata?.metrics ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="period">时间范围</Label>
        <Select
          value={filters.period}
          onValueChange={(value: PeriodType) =>
            onFilterChange({ period: value })
          }
        >
          <SelectTrigger id="period">
            <SelectValue placeholder="选择时间范围" />
          </SelectTrigger>
          <SelectContent>
            {periods.map((period) => (
              <SelectItem key={period} value={period}>
                {periodLabels[period] ?? period}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="metric">排行指标</Label>
        <Select
          value={filters.metric}
          onValueChange={(value: MetricType) =>
            onFilterChange({ metric: value })
          }
        >
          <SelectTrigger id="metric">
            <SelectValue placeholder="选择指标" />
          </SelectTrigger>
          <SelectContent>
            {metrics.length > 0 ? (
              metrics.map((m) => (
                <SelectItem key={m.key} value={m.key}>
                  {m.name}
                </SelectItem>
              ))
            ) : (
              <>
                <SelectItem value="volume_amount">交易总额</SelectItem>
                <SelectItem value="receive_amount">收款总额</SelectItem>
                <SelectItem value="payment_amount">付款总额</SelectItem>
                <SelectItem value="net_amount">净收入</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
