/**
 * Leaderboard 服务模块
 *
 * @description
 * 提供排行榜相关的服务，基于 available_balance 排序
 *
 * @example
 * ```typescript
 * import { LeaderboardService } from '@/lib/services/leaderboard';
 *
 * // 获取排行榜
 * const list = await LeaderboardService.getList({ page: 1, page_size: 20 });
 *
 * // 获取当前用户排名
 * const myRank = await LeaderboardService.getMyRank();
 * ```
 */

export { LeaderboardService } from "./leaderboard.service";
export type {
  LeaderboardEntry,
  LeaderboardListRequest,
  LeaderboardListResponse,
  UserRankInfo,
  UserRankResponse,
} from "./types";
