/**
 * Leaderboard 服务类型定义
 * 简化版：仅使用 available_balance 排序
 */

/**
 * 排行榜条目（rank 由前端根据 index + 1 计算）
 */
export interface LeaderboardEntry {
  /** 用户ID */
  user_id: number;
  /** 用户名 */
  username: string;
  /** 头像URL */
  avatar_url: string;
  /** 可用余额 */
  available_balance: string;
}

/**
 * 排行榜列表请求参数
 */
export interface LeaderboardListRequest {
  /** 页码 */
  page: number;
  /** 每页数量 */
  page_size: number;
  /** 索引签名（兼容 BaseService.get 参数类型） */
  [key: string]: unknown;
}

/**
 * 排行榜列表响应
 */
export interface LeaderboardListResponse {
  /** 排序字段 */
  sort_by: string;
  /** 排序方向 */
  order: string;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  page_size: number;
  /** 总数 */
  total: number;
  /** 排行榜条目列表 */
  items: LeaderboardEntry[];
}

/**
 * 用户排名信息
 */
export interface UserRankInfo {
  /** 用户ID */
  user_id: number;
  /** 排名 */
  rank: number;
  /** 可用余额 */
  available_balance: string;
}

/**
 * 用户排名响应
 */
export interface UserRankResponse {
  /** 用户排名信息 */
  user: UserRankInfo;
}
