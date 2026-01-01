/**
 * 信任等级
 */
export enum TrustLevel {
  /** 新用户 */
  New = 0,
  /** 基础用户 */
  Basic = 1,
  /** 成员 */
  Member = 2,
  /** 常规用户 */
  Regular = 3,
  /** 领导者 */
  Leader = 4,
}

/**
 * 支付等级
 */
export enum PayLevel {
  /** 普通 */
  Ordinary = 0,
  /** 黄金 */
  Gold = 1,
  /** 白金 */
  WhiteGold = 2,
  /** 黑金 */
  BlackGold = 3,
}

/**
 * 用户基本信息
 */
export interface User {
  /** 用户 ID */
  id: string;
  /** 账户 */
  username: string;
  /** 昵称 */
  nickname: string;
  /** 信任等级 */
  trust_level: TrustLevel;
  /** 头像 URL */
  avatar_url: string;
  /** 总接收金额 */
  total_receive: string;
  /** 总支付金额 */
  total_payment: string;
  /** 总转账金额 */
  total_transfer: string;
  /** 总社区金额 */
  total_community: string;
  /** 社区余额 */
  community_balance: string;
  /** 可用余额 */
  available_balance: string;
  /** 支付分数 */
  pay_score: number;
  /** 是否有支付密钥 */
  is_pay_key: boolean;
  /** 是否为管理员 */
  is_admin: boolean;
  /** 当日剩余配额 */
  remain_quota: string;
  /** 支付等级 */
  pay_level: PayLevel;
  /** 每日限额 */
  daily_limit: number | null;
}

/**
 * OAuth 登录 URL 响应
 * 后端直接返回字符串 URL
 */
export type OAuthLoginUrlResponse = string;

/**
 * OAuth 回调请求参数
 */
export interface OAuthCallbackRequest {
  /** 状态码 */
  state: string;
  /** 授权码 */
  code: string;
}

