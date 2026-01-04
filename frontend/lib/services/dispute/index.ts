/**
 * 争议服务模块
 *
 * @description
 * 提供争议处理相关的功能，包括：
 * - 创建争议
 * - 查询用户发起的争议列表
 * - 查询商户的争议列表
 * - 退款审核（商户）
 * - 关闭争议（用户）
 *
 * @example
 * ```typescript
 * import { DisputeService } from '@/lib/services';
 *
 * // 创建争议
 * await DisputeService.createDispute({
 *   order_id: 123,
 *   reason: '商品质量问题'
 * });
 *
 * // 查询争议列表
 * const disputes = await DisputeService.listDisputes({
 *   page: 1,
 *   page_size: 20
 * });
 * ```
 */

export { DisputeService } from "./dispute.service";
export type * from "./types";
