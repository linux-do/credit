/**
 * 红包类型
 * - fixed: 固定金额，每个红包金额相同
 * - random: 拼手气，随机分配金额
 */
export type RedEnvelopeType = 'fixed' | 'random';

/**
 * 红包状态
 * - active: 进行中，可领取
 * - finished: 已领完
 * - expired: 已过期
 */
export type RedEnvelopeStatus = 'active' | 'finished' | 'expired';

/**
 * 红包信息
 */
export interface RedEnvelope {
  /** 红包 ID */
  id: string;
  /** 创建者用户 ID */
  creator_id: string;
  /** 创建者用户名 */
  creator_username: string;
  /** 创建者头像 URL */
  creator_avatar_url?: string;
  /** 红包类型 */
  type: RedEnvelopeType;
  /** 总金额 */
  total_amount: string;
  /** 剩余金额 */
  remaining_amount: string;
  /** 红包总个数 */
  total_count: number;
  /** 剩余个数 */
  remaining_count: number;
  /** 祝福语 */
  greeting: string;
  /** 红包状态 */
  status: RedEnvelopeStatus;
  /** 过期时间 */
  expires_at: string;
  /** 创建时间 */
  created_at: string;
}

/**
 * 红包领取记录
 */
export interface RedEnvelopeClaim {
  /** 记录 ID (作为字符串以避免 JS 精度问题) */
  id: string;
  /** 红包 ID (作为字符串以避免 JS 精度问题) */
  red_envelope_id: string;
  /** 领取者用户 ID (作为字符串以避免 JS 精度问题) */
  user_id: string;
  /** 领取者用户名 */
  username: string;
  /** 领取者头像 URL */
  avatar_url?: string;
  /** 领取金额 */
  amount: string;
  /** 领取时间 */
  claimed_at: string;
}

/**
 * 创建红包请求参数
 */
export interface CreateRedEnvelopeRequest {
  /** 红包类型（fixed: 固定金额, random: 拼手气） */
  type: RedEnvelopeType;
  /** 总金额（必须大于0，最多2位小数） */
  total_amount: number;
  /** 红包个数（必须大于0） */
  total_count: number;
  /** 祝福语（可选，最大100字符） */
  greeting?: string;
  /** 支付密码（6-10位） */
  pay_key: string;
}

/**
 * 创建红包响应
 */
export interface CreateRedEnvelopeResponse {
  /** 红包 ID (作为字符串以避免 JS 精度问题) */
  id: string;
}

/**
 * 领取红包请求参数
 */
export interface ClaimRedEnvelopeRequest {
  /** 红包 ID */
  id: string;
}

/**
 * 领取红包响应
 */
export interface ClaimRedEnvelopeResponse {
  /** 领取到的金额 */
  amount: string;
  /** 红包信息 */
  red_envelope: RedEnvelope;
}

/**
 * 获取红包详情响应
 */
export interface RedEnvelopeDetailResponse {
  /** 红包信息 */
  red_envelope: RedEnvelope;
  /** 领取记录列表 */
  claims: RedEnvelopeClaim[];
  /** 当前用户的领取记录（如果已领取） */
  user_claimed?: RedEnvelopeClaim;
}

/**
 * 红包列表查询参数
 */
export interface RedEnvelopeListParams {
  /** 页码，从 1 开始 */
  page: number;
  /** 每页数量，1-100 */
  page_size: number;
  /** 查询类型（sent: 发出的, received: 收到的） */
  type?: 'sent' | 'received';
}

/**
 * 红包列表响应
 */
export interface RedEnvelopeListResponse {
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  page_size: number;
  /** 红包列表 */
  red_envelopes: RedEnvelope[];
}