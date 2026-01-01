/**
 * 订单类型
 */
export type OrderType = 'receive' | 'payment' | 'transfer' | 'community' | 'online' | 'test' | 'distribute' | 'red_envelope_send' | 'red_envelope_receive';

/**
 * 订单状态
 */
export type OrderStatus = 'success' | 'pending' | 'failed' | 'expired' | 'disputing' | 'refund' | 'refused';

/**
 * 订单信息
 */
export interface Order {
  /** 订单 ID */
  id: string;
  /** 订单号（18位字符串） */
  order_no: string;
  /** 订单名称 */
  order_name: string;
  /** 商户订单号 */
  merchant_order_no: string;
  /** 付款方用户ID */
  payer_user_id: string;
  /** 收款方用户ID */
  payee_user_id: string;
  /** 付款方账户 */
  payer_username: string;
  /** 付款方头像 */
  payer_avatar_url?: string;
  /** 收款方账户 */
  payee_username: string;
  /** 收款方头像 */
  payee_avatar_url?: string;
  /** 交易金额（decimal字符串） */
  amount: string;
  /** 订单状态 */
  status: OrderStatus;
  /** 订单类型 */
  type: OrderType;
  /** 备注 */
  remark: string;
  /** 客户端ID */
  client_id: string;
  /** 交易时间 */
  trade_time: string;
  /** 过期时间 */
  expires_at: string;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
  /** 应用名称（可选） */
  app_name?: string;
  /** 应用主页 URL（可选） */
  app_homepage_url?: string;
  /** 应用描述（可选） */
  app_description?: string;
  /** 重定向 URI（可选） */
  redirect_uri?: string;
  /** 关联的争议 ID（可选） */
  dispute_id?: string;
  /** 支付类型 */
  payment_type: string;
}

/**
 * 交易查询参数
 */
export interface TransactionQueryParams {
  /** 页码，从 1 开始 */
  page: number;
  /** 每页数量，1-100 */
  page_size: number;
  /** 订单类型（可选） */
  type?: OrderType;
  /** 订单状态（可选） */
  status?: OrderStatus;
  /** 客户端 ID（可选） */
  client_id?: string;
  /** 开始时间（可选） */
  startTime?: string;
  /** 结束时间（可选） */
  endTime?: string;
  /** 订单 ID（可选） */
  id?: string;
  /** 订单名称，支持前缀模糊查询（可选） */
  order_name?: string;
  /** 付款方账户，支持前缀模糊查询（可选） */
  payer_username?: string;
  /** 收款方账户，支持前缀模糊查询（可选） */
  payee_username?: string;
}

/**
 * 交易列表响应
 */
export interface TransactionListResponse {
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  page_size: number;
  /** 订单列表 */
  orders: Order[];
}

/**
 * 用户转账请求
 */
export interface TransferRequest {
  /** 收款人用户 ID */
  recipient_id: string;
  /** 收款人账户 */
  recipient_username: string;
  /** 转账金额（必须大于0，最多2位小数） */
  amount: number | string;
  /** 支付密码（6-10位） */
  pay_key: string;
  /** 备注（可选，最大200字符） */
  remark?: string;
}

/**
 * 用户转账响应
 */
export interface TransferResponse {
  /** 订单 ID */
  order_id: string;
  /** 订单号 */
  order_no: string;
  /** 交易时间 */
  trade_time: string;
}

