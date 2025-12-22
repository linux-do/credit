/**
 * 商户 API Key 信息
 */
export interface MerchantAPIKey {
  /** API Key ID */
  id: number;
  /** 用户 ID */
  user_id: number;
  /** 客户端 ID */
  client_id: string;
  /** 客户端密钥 */
  client_secret: string;
  /** 应用名称 */
  app_name: string;
  /** 应用主页 URL */
  app_homepage_url: string;
  /** 应用描述 */
  app_description: string;
  /** 重定向 URI */
  redirect_uri?: string;
  /** 通知 URL */
  notify_url: string;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
  /** 删除时间（软删除） */
  deleted_at: string | null;
}

/**
 * 创建商户 API Key 请求参数
 */
export interface CreateAPIKeyRequest {
  /** 应用名称（最大20字符） */
  app_name: string;
  /** 应用主页 URL（最大100字符，必须是有效的 URL） */
  app_homepage_url: string;
  /** 应用描述（最大100字符，可选） */
  app_description?: string;
  /** 重定向 URI（最大100字符，必须是有效的 URL，可选） */
  redirect_uri?: string;
  /** 通知 URL（最大100字符，必须是有效的 URL） */
  notify_url: string;
}

/**
 * 更新商户 API Key 请求参数
 */
export interface UpdateAPIKeyRequest {
  /** 应用名称（最大20字符，可选） */
  app_name?: string;
  /** 应用主页 URL（最大100字符，必须是有效的 URL，可选） */
  app_homepage_url?: string;
  /** 应用描述（最大100字符，可选） */
  app_description?: string;
  /** 重定向 URI（最大100字符，必须是有效的 URL，可选） */
  redirect_uri?: string;
  /** 通知 URL（最大100字符，必须是有效的 URL，可选） */
  notify_url?: string;
}

/**
 * 支付商户订单请求参数
 */
export interface PayMerchantOrderRequest {
  /** 订单号（加密后的订单ID） */
  order_no: string;
  /** 支付密码（6位数字） */
  pay_key: string;
}

/**
 * 查询商户订单请求参数
 */
export interface GetMerchantOrderRequest {
  /** 订单号（加密后的订单ID） */
  order_no: string;
}

/**
 * 查询商户订单响应
 */
export interface GetMerchantOrderResponse {
  /** 订单信息 */
  order: {
    /** 订单ID */
    id: number;
    /** 订单号 */
    order_no: string;
    /** 订单名称 */
    order_name: string;
    /** 付款方账户 */
    payer_username: string;
    /** 收款方账户 */
    payee_username: string;
    /** 交易金额 */
    amount: string;
    /** 订单状态 */
    status: string;
    /** 订单类型 */
    type: string;
    /** 支付类型 */
    payment_type: string;
    /** 备注 */
    remark: string;
    /** 客户端ID */
    client_id: string;
    /** 同步跳转URL */
    return_url: string;
    /** 异步通知URL */
    notify_url: string;
    /** 交易时间 */
    trade_time: string | null;
    /** 创建时间 */
    created_at: string;
    /** 更新时间 */
    updated_at: string;
  };
  /** 用户支付配置信息 */
  user_pay_config: {
    /** 配置ID */
    id: number;
    /** 支付等级 */
    level: number;
    /** 最低分数 */
    min_score: number;
    /** 最高分数 */
    max_score: number | null;
    /** 每日限额 */
    daily_limit: number | null;
    /** 手续费率 */
    fee_rate: string;
    /** 创建时间 */
    created_at: string;
    /** 更新时间 */
    updated_at: string;
  };
  /** 商户信息 */
  merchant: {
    /** 应用名称 */
    app_name: string;
    /** 跳转URI */
    redirect_uri: string;
  };
}

/**
 * 支付链接信息
 */
export interface PaymentLink {
  /** 链接 ID */
  id: number;
  /** 商户 API Key ID */
  merchant_api_key_id: number;
  /** 支付链接 Token */
  token: string;
  /** 金额 */
  amount: string;
  /** 商品名称 */
  product_name: string;
  /** 备注 */
  remark: string;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
  /** 应用名称 */
  app_name: string;
}

/**
 * 创建支付链接请求参数
 */
export interface CreatePaymentLinkRequest {
  /** 金额 */
  amount: number | string;
  /** 商品名称 */
  product_name: string;
  /** 备注（可选） */
  remark?: string;
}

/**
 * 通过支付链接支付请求参数
 */
export interface PayByLinkRequest {
  /** 支付链接 Token */
  token: string;
  /** 支付密码（6位数字） */
  pay_key: string;
  /** 备注（可选，最大100字符） */
  remark?: string;
}

/**
 * 获取支付链接信息响应
 * 包含支付链接信息和商户信息
 */
export interface GetPaymentLinkInfoResponse {
  /** 支付链接信息 */
  payment_link: PaymentLink;
  /** 商户信息 */
  merchant: {
    /** 应用名称 */
    app_name: string;
    /** 跳转URI */
    redirect_uri: string;
  };
  /** 用户支付配置信息 */
  user_pay_config: {
    /** 配置ID */
    id: number;
    /** 支付等级 */
    level: number;
    /** 最低分数 */
    min_score: number;
    /** 最高分数 */
    max_score: number | null;
    /** 每日限额 */
    daily_limit: number | null;
    /** 手续费率 */
    fee_rate: string;
    /** 创建时间 */
    created_at: string;
    /** 更新时间 */
    updated_at: string;
  };
}

/**
 * 商户查询订单请求参数
 */
export interface QueryMerchantOrderRequest {
  /** 商户订单号（可选） */
  out_trade_no?: string;
  /** 平台订单号 */
  trade_no: number;
  /** 客户端 ID */
  pid: string;
  /** 客户端密钥 */
  key: string;
}

/**
 * 商户查询订单响应
 */
export interface QueryMerchantOrderResponse {
  /** 状态码（1表示成功，-1表示失败） */
  code: number;
  /** 响应消息 */
  msg: string;
  /** 平台订单号 */
  trade_no: string;
  /** 商户订单号 */
  out_trade_no: string;
  /** 支付类型 */
  type: string;
  /** 客户端 ID */
  pid: string;
  /** 订单创建时间 */
  addtime: string;
  /** 订单完成时间 */
  endtime: string;
  /** 订单名称 */
  name: string;
  /** 订单金额 */
  money: string;
  /** 订单状态（1表示已支付，0表示未支付） */
  status: number;
}

/**
 * 商户退款请求参数
 */
export interface RefundMerchantOrderRequest {
  /** 客户端 ID */
  pid: string;
  /** 客户端密钥 */
  key: string;
  /** 商户订单号（可选） */
  out_trade_no?: string;
  /** 平台订单号 */
  trade_no: number;
  /** 退款金额 */
  money: number | string;
}

/**
 * 商户退款响应
 */
export interface RefundMerchantOrderResponse {
  /** 状态码（1表示成功，-1表示失败） */
  code: number;
  /** 响应消息 */
  msg: string;
}

