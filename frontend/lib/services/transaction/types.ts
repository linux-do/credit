/**
 * 订单类型
 */
export type OrderType = 'receive' | 'payment' | 'transfer' | 'community';

/**
 * 订单状态
 */
export type OrderStatus = 'success' | 'pending' | 'failed' | 'disputing' | 'refund' | 'refunding';

/**
 * 订单信息
 */
export interface Order {
  /** 订单 ID */
  id: number;
  /** 订单号（18位字符串） */
  order_no: string;
  /** 订单名称 */
  order_name: string;
  /** 商户订单号 */
  merchant_order_no: string;
  /** 付款方用户名 */
  payer_username: string;
  /** 收款方用户名 */
  payee_username: string;
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
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
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
  /** 开始时间（可选） */
  startTime?: string;
  /** 结束时间（可选） */
  endTime?: string;
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

