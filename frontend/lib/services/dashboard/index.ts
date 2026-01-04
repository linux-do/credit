/**
 * Dashboard 服务模块
 *
 * @description
 * 提供仪表板统计数据相关的服务，包括：
 * - 每日收支统计
 * - Top 客户统计
 *
 * @example
 * ```typescript
 * import { DashboardService } from '@/lib/services/dashboard';
 *
 * // 获取最近7天的收支统计
 * const dailyStats = await DashboardService.getDailyStats(7);
 *
 * // 获取 Top 5 客户
 * const topCustomers = await DashboardService.getTopCustomers(7, 5);
 * ```
 */

export { DashboardService } from "./dashboard.service";
export type {
  DailyStatsItem,
  DailyStatsResponse,
  GetDailyStatsRequest,
  TopCustomer,
  TopCustomersResponse,
  GetTopCustomersRequest,
} from "./types";
