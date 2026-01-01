import { BaseService } from '../core/base.service';
import type { TransactionQueryParams, TransactionListResponse, TransferRequest, TransferResponse } from './types';

/**
 * 交易服务
 * 处理订单和交易记录相关的 API 请求
 */
export class TransactionService extends BaseService {
  protected static readonly basePath = '/api/v1/order';

  /**
   * 获取交易记录列表（分页）
   * @param params - 查询参数
   * @returns 交易记录列表
   * @throws {UnauthorizedError} 当未登录时
   * @throws {ValidationError} 当参数验证失败时
   * 
   * @example
   * ```typescript
   * const result = await TransactionService.getTransactions({
   *   page: 1,
   *   page_size: 20,
   *   type: 'receive',
   *   status: 'success'
   * });
   * ```
   */
  static async getTransactions(params: TransactionQueryParams): Promise<TransactionListResponse> {
    return this.post<TransactionListResponse>('/transactions', params as unknown as Record<string, unknown>);
  }

  /**
   * 用户转账
   * @param data - 转账信息
   * @returns 转账结果（订单信息）
   * @throws {UnauthorizedError} 当未登录时
   * @throws {NotFoundError} 当收款人不存在时
   * @throws {ValidationError} 当参数验证失败时
   * @throws {BadRequestError} 当余额不足或支付密码错误时
   * 
   * @example
   * ```typescript
   * const result = await TransactionService.transfer({
   *   recipient_id: 123,
   *   recipient_username: 'user123',
   *   amount: 100.50,
   *   pay_key: '123456',
   *   remark: '转账备注'
   * });
   * ```
   * 
   * @remarks
   * - 转账金额必须大于0，最多2位小数
   * - 支付密码必须为6-10位
   * - 备注最大200字符
   * - 不能给自己转账
   * - 需要确保账户余额充足
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async transfer(data: TransferRequest): Promise<TransferResponse> {
    throw new Error('积分转移功能已下架，请遵循积分使用规范并使用正确流转功能继续！');
  }
}

