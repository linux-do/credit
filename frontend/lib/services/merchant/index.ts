/**
 * 商户服务模块
 * 
 * @description
 * 提供商户相关的功能，包括：
 * - API Key 管理（创建、查询、更新、删除）
 * - 支付链接管理（创建、列表、删除）
 * - 商户订单查询和支付
 * - 商户订单退款
 * 
 * @example
 * ```typescript
 * import { MerchantService } from '@/lib/services';
 * 
 * // 创建 API Key
 * const apiKey = await MerchantService.createAPIKey({
 *   app_name: '我的应用',
 *   app_homepage_url: 'https://example.com',
 *   redirect_url: 'https://example.com/callback',
 *   notify_url: 'https://example.com/notify'
 * });
 * 
 * // 获取支付链接
 * const links = await MerchantService.listPaymentLinks(apiKey.id);
 * ```
 */

export { MerchantService } from './merchant.service';
export type {
  MerchantAPIKey,
  CreateAPIKeyRequest,
  UpdateAPIKeyRequest,
  PayMerchantOrderRequest,
  GetMerchantOrderRequest,
  GetMerchantOrderResponse,
  PaymentLink,
  CreatePaymentLinkRequest,
  PayByLinkRequest,
  GetPaymentLinkInfoResponse,
  QueryMerchantOrderRequest,
  QueryMerchantOrderResponse,
  RefundMerchantOrderRequest,
  RefundMerchantOrderResponse,
} from './types';

