/**
 * 更新支付密钥请求
 */
export interface UpdatePayKeyRequest {
  /** 当前支付密钥（已设置支付密钥时必填） */
  current_pay_key?: string;
  /** 新的支付密钥（6位数字） */
  pay_key: string;
}
