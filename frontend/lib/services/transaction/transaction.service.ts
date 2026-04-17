import { BaseService } from '../core/base.service';
import type { TransactionQueryParams, TransactionListResponse } from './types';

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
   *   types: ['receive'],
   *   statuses: ['success'],
   *   payee_transfer_status: 'pending'
   * });
   * ```
   */
  static async getTransactions(params: TransactionQueryParams): Promise<TransactionListResponse> {
    return this.post<TransactionListResponse>('/transactions', params as unknown as Record<string, unknown>);
  }
}
