import { BaseService } from "../core/base.service";
import type {
  LeaderboardListRequest,
  LeaderboardListResponse,
  UserRankResponse,
} from "./types";

/**
 * 排行榜服务
 * 简化版：基于 available_balance 排序
 */
export class LeaderboardService extends BaseService {
  protected static readonly basePath = "/api/v1/leaderboard";

  /**
   * 获取排行榜列表
   * @param params - 分页参数
   * @returns 排行榜列表响应
   */
  static async getList(
    params?: LeaderboardListRequest,
  ): Promise<LeaderboardListResponse> {
    return this.get<LeaderboardListResponse>("", params);
  }

  /**
   * 获取当前用户排名
   * @returns 用户排名响应
   */
  static async getMyRank(): Promise<UserRankResponse> {
    return this.get<UserRankResponse>("/me");
  }

  /**
   * 获取指定用户排名
   * @param userId - 用户 ID
   * @returns 用户排名响应
   */
  static async getUserRankById(userId: number): Promise<UserRankResponse> {
    return this.get<UserRankResponse>(`/users/${userId}`);
  }
}
