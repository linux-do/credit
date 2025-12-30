/**
 * 排行榜服务模块
 *
 * @description
 * 提供排行榜相关功能，包括：
 * - 获取排行榜列表（支持分页）
 * - 获取当前用户排名
 * - 获取指定用户排名
 * - 获取排行榜元数据配置
 *
 * @example
 * ```typescript
 * import { LeaderboardService } from '@/lib/services/leaderboard';
 *
 * // 获取排行榜列表
 * const list = await LeaderboardService.getList({ period: 'week', metric: 'net_amount' });
 *
 * // 获取当前用户排名
 * const myRank = await LeaderboardService.getMyRank({ period: 'week' });
 *
 * // 获取元数据
 * const metadata = await LeaderboardService.getMetadata();
 * ```
 */

export { LeaderboardService } from "./leaderboard.service";
export { type PeriodType, type MetricType } from "./types";
export type {
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardListResponse,
  UserRankResponse,
  LeaderboardMetadata,
  LeaderboardQueryParams,
} from "./types";
