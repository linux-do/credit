import { BaseService } from "../core/base.service";
import type {
  LeaderboardListResponse,
  LeaderboardMetadata,
  LeaderboardQueryParams,
  UserRankResponse,
} from "./types";

export class LeaderboardService extends BaseService {
  protected static readonly basePath = "/api/v1/leaderboard";

  static async getList(params?: LeaderboardQueryParams) {
    return this.get<LeaderboardListResponse>(
      "",
      params as Record<string, unknown> | undefined,
    );
  }

  static async getMyRank(params?: LeaderboardQueryParams) {
    return this.get<UserRankResponse>(
      "/me",
      params as Record<string, unknown> | undefined,
    );
  }

  static async getUserRank(userId: number, params?: LeaderboardQueryParams) {
    return this.get<UserRankResponse>(
      `/users/${userId}`,
      params as Record<string, unknown> | undefined,
    );
  }

  static async getMetadata() {
    return this.get<LeaderboardMetadata>("/metadata");
  }
}

export * from "./types";
