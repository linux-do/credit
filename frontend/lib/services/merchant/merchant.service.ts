import { BaseService } from '../core/base.service';
import apiClient from '../core/api-client';
import type { InternalAxiosRequestConfig } from 'axios';
import type {
  MerchantAPIKey,
  CreateAPIKeyRequest,
  UpdateAPIKeyRequest,
  PayMerchantOrderRequest,
  GetMerchantOrderRequest,
  GetMerchantOrderResponse,
  PaymentLink,
  CreatePaymentLinkRequest,
  QueryMerchantOrderRequest,
  QueryMerchantOrderResponse,
  RefundMerchantOrderRequest,
  RefundMerchantOrderResponse,
} from './types';

/**
 * 商户服务
 * 处理商户 API Key 管理和支付订单相关的 API 请求
 */
export class MerchantService extends BaseService {
  protected static readonly basePath = '/api/v1/merchant';

  // ==================== API Key 管理 ====================

  /**
   * 创建商户 API Key
   * @param request - 创建 API Key 的请求参数
   * @returns 创建的 API Key 信息（包含 client_secret）
   * @throws {UnauthorizedError} 当未登录时
   * @throws {ValidationError} 当参数验证失败时
   * 
   * @example
   * ```typescript
   * const apiKey = await MerchantService.createAPIKey({
   *   app_name: '我的应用',
   *   app_homepage_url: 'https://example.com',
   *   app_description: '应用描述',
   *   redirect_uri: 'https://example.com/callback'
   * });
   * console.log('Client ID:', apiKey.client_id);
   * console.log('Client Secret:', apiKey.client_secret); // 请保存，之后无法再次获取
   * ```
   */
  static async createAPIKey(request: CreateAPIKeyRequest): Promise<MerchantAPIKey> {
    return this.post<MerchantAPIKey>('/api-keys', request);
  }

  /**
   * 获取商户 API Key 列表
   * @returns API Key 列表
   * @throws {UnauthorizedError} 当未登录时
   * 
   * @example
   * ```typescript
   * const apiKeys = await MerchantService.listAPIKeys();
   * console.log('API Keys 数量:', apiKeys.length);
   * ```
   */
  static async listAPIKeys(): Promise<MerchantAPIKey[]> {
    return this.get<MerchantAPIKey[]>('/api-keys');
  }

  /**
   * 获取单个商户 API Key
   * @param id - API Key ID
   * @returns API Key 详细信息
   * @throws {UnauthorizedError} 当未登录时
   * @throws {NotFoundError} 当 API Key 不存在时
   * @throws {ForbiddenError} 当无权访问该 API Key 时
   * 
   * @example
   * ```typescript
   * const apiKey = await MerchantService.getAPIKey(123);
   * console.log('应用名称:', apiKey.app_name);
   * ```
   */
  static async getAPIKey(id: number): Promise<MerchantAPIKey> {
    return this.get<MerchantAPIKey>(`/api-keys/${id}`);
  }

  /**
   * 更新商户 API Key
   * @param id - API Key ID
   * @param request - 更新 API Key 的请求参数
   * @returns void
   * @throws {UnauthorizedError} 当未登录时
   * @throws {NotFoundError} 当 API Key 不存在时
   * @throws {ForbiddenError} 当无权访问该 API Key 时
   * @throws {ValidationError} 当参数验证失败时
   * 
   * @example
   * ```typescript
   * await MerchantService.updateAPIKey(123, {
   *   app_name: '新的应用名称',
   *   app_description: '新的描述'
   * });
   * ```
   */
  static async updateAPIKey(
    id: number,
    request: UpdateAPIKeyRequest,
  ): Promise<void> {
    return this.put<void>(`/api-keys/${id}`, request);
  }

  /**
   * 删除商户 API Key
   * @param id - API Key ID
   * @returns void
   * @throws {UnauthorizedError} 当未登录时
   * @throws {NotFoundError} 当 API Key 不存在时
   * @throws {ForbiddenError} 当无权访问该 API Key 时
   * 
   * @example
   * ```typescript
   * await MerchantService.deleteAPIKey(123);
   * ```
   */
  static async deleteAPIKey(id: number): Promise<void> {
    return this.delete<void>(`/api-keys/${id}`);
  }

  // ==================== 支付链接管理 ====================

  /**
   * 创建支付链接
   * @param apiKeyId - API Key ID
   * @param request - 创建支付链接请求参数
   * @returns 创建的支付链接信息
   * @throws {UnauthorizedError} 当未登录时
   * @throws {NotFoundError} 当 API Key 不存在时
   * @throws {ForbiddenError} 当无权访问该 API Key 时
   * 
   * @example
   * ```typescript
   * const link = await MerchantService.createPaymentLink(123, {
   *   product_name: '测试商品',
   *   amount: 100,
   *   remark: '备注信息'
   * });
   * console.log('支付链接 Token:', link.token);
   * ```
   */
  static async createPaymentLink(apiKeyId: number, request: CreatePaymentLinkRequest): Promise<PaymentLink> {
    return this.post<PaymentLink>(`/api-keys/${apiKeyId}/payment-links`, request);
  }

  /**
   * 获取支付链接列表
   * @param apiKeyId - API Key ID
   * @returns 支付链接列表
   * @throws {UnauthorizedError} 当未登录时
   * @throws {NotFoundError} 当 API Key 不存在时
   * @throws {ForbiddenError} 当无权访问该 API Key 时
   * 
   * @example
   * ```typescript
   * const links = await MerchantService.listPaymentLinks(123);
   * console.log('支付链接数量:', links.length);
   * ```
   */
  static async listPaymentLinks(apiKeyId: number): Promise<PaymentLink[]> {
    return this.get<PaymentLink[]>(`/api-keys/${apiKeyId}/payment-links`);
  }

  /**
   * 删除支付链接
   * @param apiKeyId - API Key ID
   * @param linkId - 支付链接 ID
   * @returns void
   * @throws {UnauthorizedError} 当未登录时
   * @throws {NotFoundError} 当 API Key 或支付链接不存在时
   * @throws {ForbiddenError} 当无权访问该 API Key 时
   * 
   * @example
   * ```typescript
   * await MerchantService.deletePaymentLink(123, 456);
   * ```
   */
  static async deletePaymentLink(apiKeyId: number, linkId: number): Promise<void> {
    return this.delete<void>(`/api-keys/${apiKeyId}/payment-links/${linkId}`);
  }

  // ==================== 商户支付订单 ====================

  /**
   * 查询商户订单信息
   *
   * @description
   * 查询商户创建的订单详细信息，用于支付页面显示订单信息。
   * 订单必须处于待支付状态。
   *
   * @param request - 查询订单请求参数
   * @returns 订单信息和用户支付配置
   * @throws {UnauthorizedError} 当用户未登录时
   * @throws {NotFoundError} 当订单不存在时
   * @throws {ValidationError} 当订单号格式错误时
   * @throws {ApiErrorBase} 当订单已过期或已支付等业务错误时
   *
   * @example
   * ```typescript
   * // 从 URL 获取订单号
   * const params = new URLSearchParams(window.location.search);
   * const orderNo = params.get('order_no');
   *
   * if (orderNo) {
   *   try {
   *     const orderInfo = await MerchantService.getMerchantOrder({ order_no: orderNo });
   *     console.log('订单信息:', orderInfo.order);
   *     console.log('支付配置:', orderInfo.user_pay_config);
   *   } catch (error) {
   *     console.error('查询订单失败:', error.message);
   *   }
   * }
   * ```
   *
   * @remarks
   * - 订单必须处于待支付状态
   * - 返回的用户支付配置包含手续费率等信息
   */
  static async getMerchantOrder(request: GetMerchantOrderRequest): Promise<GetMerchantOrderResponse> {
    return this.get<GetMerchantOrderResponse>('/payment/order', { order_no: request.order_no });
  }

  /**
   * 支付商户订单
   *
   * @description
   * 用户使用此接口支付商户创建的订单。
   * 需要用户登录，并且用户余额充足。
   *
   * @param request - 支付订单请求参数
   * @returns void
   * @throws {UnauthorizedError} 当用户未登录时
   * @throws {NotFoundError} 当订单不存在或已过期时
   * @throws {ValidationError} 当订单号格式错误时
   * @throws {ApiErrorBase} 当余额不足、订单已支付等业务错误时
   *
   * @example
   * ```typescript
   * // 从 URL 获取订单号
   * const params = new URLSearchParams(window.location.search);
   * const orderNo = params.get('order_no');
   *
   * if (orderNo) {
   *   try {
   *     await MerchantService.payMerchantOrder({
   *       order_no: orderNo,
   *       pay_key: '123456'  // 用户的支付密码
   *     });
   *     // 支付成功
   *     console.log('支付成功');
   *   } catch (error) {
   *     console.error('支付失败:', error.message);
   *   }
   * }
   * ```
   *
   * @remarks
   * - 用户不能支付自己作为商户创建的订单
   * - 订单必须在有效期内（5分钟）
   * - 用户余额必须充足
   * - 支付成功后会扣除手续费（根据用户的支付等级）
   */
  static async payMerchantOrder(request: PayMerchantOrderRequest): Promise<void> {
    return this.post<void>('/payment', request);
  }

  /**
   * 商户查询订单状态
   * 
   * @description
   * 商户使用此接口主动查询订单的支付状态。
   * 需要提供商户凭证（Client ID 和 Client Secret）。
   * 
   * @param params - 查询参数
   * @returns 订单状态信息
   * @throws {ValidationError} 当参数验证失败时
   * @throws {ApiErrorBase} 当商户凭证无效或订单不存在时
   * 
   * @example
   * ```typescript
   * const orderStatus = await MerchantService.queryMerchantOrder({
   *   trade_no: 12345,
   *   pid: 'your_client_id',
   *   key: 'your_client_secret'
   * });
   * 
   * if (orderStatus.status === 1) {
   *   console.log('订单已支付');
   * } else {
   *   console.log('订单未支付');
   * }
   * ```
   * 
   * @remarks
   * - 使用 GET 请求调用 `/api.php` 接口
   * - 返回的 status 字段：1 表示已支付，0 表示未支付
   */
  static async queryMerchantOrder(
    params: QueryMerchantOrderRequest
  ): Promise<QueryMerchantOrderResponse> {
    // 直接使用 apiClient，因为这个接口不在标准 RESTful 路径下
    const response = await apiClient.get<QueryMerchantOrderResponse>(
      '/epay/api.php',
      { params } as InternalAxiosRequestConfig
    );
    return response.data;
  }

  /**
   * 商户退款
   * 
   * @description
   * 商户使用此接口对已支付的订单进行退款。
   * 需要提供商户凭证（Client ID 和 Client Secret）。
   * 退款金额必须与订单金额一致。
   * 
   * @param params - 退款请求参数
   * @returns 退款结果
   * @throws {ValidationError} 当参数验证失败时
   * @throws {ApiErrorBase} 当商户凭证无效、订单不存在或退款失败时
   * 
   * @example
   * ```typescript
   * const result = await MerchantService.refundMerchantOrder({
   *   trade_no: 12345,
   *   money: 99.99,
   *   pid: 'your_client_id',
   *   key: 'your_client_secret'
   * });
   * 
   * if (result.code === 1) {
   *   console.log('退款成功');
   * } else {
   *   console.error('退款失败:', result.msg);
   * }
   * ```
   * 
   * @remarks
   * - 使用 POST 请求调用 `/api.php` 接口
   * - 退款金额必须与订单金额完全一致
   * - 只能对状态为"成功"的订单进行退款
   * - 返回的 code 字段：1 表示成功，-1 表示失败
   */
  static async refundMerchantOrder(
    params: RefundMerchantOrderRequest
  ): Promise<RefundMerchantOrderResponse> {
    // 直接使用 apiClient，因为这个接口不在标准 RESTful 路径下
    const response = await apiClient.post<RefundMerchantOrderResponse>(
      '/epay/api.php',
      params
    );
    return response.data;
  }
}

