import { BaseService } from "../core/base.service";
import type { DailyStatsResponse, TopCustomersResponse } from "./types";

/**
 * 仪表板服务
 * 处理仪表板统计数据相关的 API 请求
 */
export class DashboardService extends BaseService {
  protected static readonly basePath = "/api/v1/dashboard";

  /**
   * 获取每日收支统计
   * @param days - 查询天数，最大7天，最小1天
   * @returns 每日统计数据列表
   * @throws {UnauthorizedError} 当未登录时
   * @throws {ValidationError} 当参数验证失败时
   *
   * @example
   * ```typescript
   * const stats = await DashboardService.getDailyStats(7);
   * console.log('每日统计:', stats);
   * // 输出: [
   * //   { date: '2025-12-22', income: '1000.00', expense: '500.00' },
   * //   { date: '2025-12-21', income: '800.00', expense: '300.00' },
   * //   ...
   * // ]
   * ```
   *
   * @remarks
   * - days 参数必须在 1-7 之间
   * - 返回的数据按日期降序排列
   * - income 和 expense 为字符串格式的金额
   */
  static async getDailyStats(days: number): Promise<DailyStatsResponse> {
    return this.get<DailyStatsResponse>("/stats/daily", { days });
  }

  /**
   * 获取 Top 客户统计
   * @param days - 查询天数，最大7天，最小1天
   * @param limit - 返回数量，最大10条，最小1条
   * @returns Top 客户列表
   * @throws {UnauthorizedError} 当未登录时
   * @throws {ValidationError} 当参数验证失败时
   *
   * @example
   * ```typescript
   * const customers = await DashboardService.getTopCustomers(7, 5);
   * console.log('Top 5 客户:', customers);
   * // 输出: [
   * //   { user_id: 123, username: 'user1', total_amount: '5000.00', order_count: 10 },
   * //   { user_id: 456, username: 'user2', total_amount: '3000.00', order_count: 8 },
   * //   ...
   * // ]
   * ```
   *
   * @remarks
   * - days 参数必须在 1-7 之间
   * - limit 参数必须在 1-10 之间
   * - 返回的数据按累计付款金额降序排列
   * - total_amount 为字符串格式的金额
   */
  static async getTopCustomers(
    days: number,
    limit: number
  ): Promise<TopCustomersResponse> {
    return this.get<TopCustomersResponse>("/stats/top-customers", {
      days,
      limit,
    });
  }
}
