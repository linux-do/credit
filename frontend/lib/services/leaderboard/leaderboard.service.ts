import { AxiosRequestConfig } from "axios";
import { BaseService } from "../core/base.service";
import type {
  LeaderboardListResponse,
  LeaderboardMetadata,
  LeaderboardQueryParams,
  UserRankResponse,
} from "./types";

/**
 * 排行榜服务
 * 提供排行榜列表、用户排名、元数据等接口
 */
export class LeaderboardService extends BaseService {
  protected static readonly basePath = "/api/v1/leaderboard";

  /**
   * 获取排行榜列表
   * @param params - 查询参数（周期、指标、分页等）
   * @param config - 请求配置（支持 AbortController signal）
   * @returns 排行榜列表响应
   */
  static async getList(
    params?: LeaderboardQueryParams,
    config?: AxiosRequestConfig,
  ) {
    return this.get<LeaderboardListResponse>(
      "",
      params as Record<string, unknown> | undefined,
      config,
    );
  }

  /**
   * 获取当前用户排名
   * @param params - 查询参数（周期、指标）
   * @param config - 请求配置（支持 AbortController signal）
   * @returns 用户排名响应
   */
  static async getMyRank(
    params?: LeaderboardQueryParams,
    config?: AxiosRequestConfig,
  ) {
    return this.get<UserRankResponse>(
      "/me",
      params as Record<string, unknown> | undefined,
      config,
    );
  }

  /**
   * 获取指定用户排名
   * @param userId - 用户 ID
   * @param params - 查询参数（周期、指标）
   * @param config - 请求配置（支持 AbortController signal）
   * @returns 用户排名响应
   */
  static async getUserRank(
    userId: number,
    params?: LeaderboardQueryParams,
    config?: AxiosRequestConfig,
  ) {
    return this.get<UserRankResponse>(
      `/users/${userId}`,
      params as Record<string, unknown> | undefined,
      config,
    );
  }

  /**
   * 获取排行榜元数据
   * @returns 可用的周期、指标和默认配置
   */
  static async getMetadata() {
    return this.get<LeaderboardMetadata>("/metadata");
  }
}
