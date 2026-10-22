/**
 * 更新支付密钥请求
 */
export interface UpdatePayKeyRequest {
  /** 当前支付密钥（已设置支付密钥时必填） */
  current_pay_key?: string;
  /** 新的支付密钥（6位数字） */
  pay_key: string;
}

/**
 * 公共账号信息
 */
export interface PublicAccountInfo {
  /** 公共账号 ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname: string;
  /** 头像 URL */
  avatar_url: string;
}

/**
 * 公共账号绑定列表响应
 */
export interface PublicAccountsResponse {
  /** 可切换的公共账号列表（真实身份下有值） */
  public_accounts: PublicAccountInfo[];
}

