/**
 * 争议状态
 */
export type DisputeStatus = 'disputing' | 'refund' | 'closed';

/**
 * 争议信息
 */
export interface Dispute {
  /** 争议 ID */
  id: string;
  /** 订单 ID */
  order_id: string;
  /** 发起者用户 ID */
  initiator_user_id: number;
  /** 争议原因 */
  reason: string;
  /** 争议状态 */
  status: DisputeStatus;
  /** 处理者用户 ID */
  handler_user_id?: number;
  /** 发起者账户 */
  initiator_username: string;
  /** 处理者账户 */
  handler_username: string;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 争议列表项（包含订单信息）
 */
export interface DisputeWithOrder extends Dispute {
  /** 订单名称 */
  order_name: string;
  /** 收款方账户 */
  payee_username: string;
  /** 订单金额 */
  amount: string;
}

/**
 * 查询争议列表请求
 */
export interface ListDisputesRequest {
  /** 页码，从 1 开始 */
  page: number;
  /** 每页数量，1-100 */
  page_size: number;
  /** 状态筛选（可选） */
  status?: DisputeStatus;
  /** 争议 ID（可选） */
  dispute_id?: string;
}

/**
 * 争议列表响应
 */
export interface ListDisputesResponse {
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  page_size: number;
  /** 争议列表 */
  disputes: DisputeWithOrder[];
}

/**
 * 退款审核请求
 */
export interface RefundReviewRequest {
  /** 争议 ID */
  dispute_id: string;
  /** 审核结果 */
  status: 'refund' | 'closed';
  /** 拒绝原因（status 为 closed 时必填，最大 100 字符） */
  reason?: string;
}

/**
 * 关闭争议请求
 */
export interface CloseDisputeRequest {
  /** 争议 ID */
  dispute_id: string;
}

/**
 * 创建争议请求
 */
export interface CreateDisputeRequest {
  /** 订单 ID */
  order_id: string;
  /** 争议原因（最大 100 字符） */
  reason: string;
}
