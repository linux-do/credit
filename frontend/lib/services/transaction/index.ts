/**
 * 交易服务模块
 *
 * @description
 * 提供交易相关的功能，包括：
 * - 查询交易记录列表（分页）
 * - 用户转账
 *
 * @example
 * ```typescript
 * import { TransactionService } from '@/lib/services';
 *
 * // 查询交易记录
 * const result = await TransactionService.getTransactions({
 *   page: 1,
 *   page_size: 20,
 *   type: 'receive',
 *   status: 'success'
 * });
 *
 * // 用户转账
 * await TransactionService.transfer({
 *   recipient_id: 123,
 *   recipient_username: 'user123',
 *   amount: 100.50,
 *   pay_key: '123456',
 *   remark: '转账备注'
 * });
 * ```
 */

export { TransactionService } from "./transaction.service";
export type {
  Order,
  OrderType,
  OrderStatus,
  TransactionQueryParams,
  TransactionListResponse,
  TransferRequest,
  TransferResponse,
} from "./types";
