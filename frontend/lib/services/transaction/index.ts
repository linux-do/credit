/**
 * 交易服务模块
 *
 * @description
 * 提供交易相关的功能，包括：
 * - 查询交易记录列表（分页）
 *
 * @example
 * ```typescript
 * import { TransactionService } from '@/lib/services';
 *
 * // 查询交易记录
 * const result = await TransactionService.getTransactions({
 *   page: 1,
 *   page_size: 20,
 *   types: ['receive'],
 *   statuses: ['success'],
 *   payee_transfer_status: 'pending',
 * });
 * ```
 */

export { TransactionService } from './transaction.service';
export { DEFAULT_ORDER_TYPES } from './types';
export type {
  Order,
  OrderType,
  OrderStatus,
  TransferStatus,
  TransactionQueryParams,
  TransactionListResponse,
} from './types';
