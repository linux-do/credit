import { BaseService } from "../core/base.service";
import type {
  ListDisputesRequest,
  ListDisputesResponse,
  RefundReviewRequest,
  CloseDisputeRequest,
  CreateDisputeRequest,
} from "./types";

/**
 * 争议服务
 * 处理争议相关的 API 请求
 */
export class DisputeService extends BaseService {
  protected static readonly basePath = "/api/v1/order";

  /**
   * 创建争议
   * @param data - 争议信息
   * @returns void
   * @throws {UnauthorizedError} 当未登录时
   * @throws {NotFoundError} 当订单不存在或不符合争议条件时
   * @throws {ValidationError} 当参数验证失败时
   *
   * @example
   * ```typescript
   * await DisputeService.createDispute({
   *   order_id: 123,
   *   reason: '商品质量问题'
   * });
   * ```
   */
  static async createDispute(data: CreateDisputeRequest): Promise<void> {
    return this.post("/dispute", data);
  }

  /**
   * 查询用户发起的争议列表
   * @param params - 查询参数
   * @returns 争议列表
   * @throws {UnauthorizedError} 当未登录时
   * @throws {ValidationError} 当参数验证失败时
   *
   * @example
   * ```typescript
   * const result = await DisputeService.listDisputes({
   *   page: 1,
   *   page_size: 20,
   *   status: 'disputing'
   * });
   * console.log('争议数量:', result.total);
   * ```
   */
  static async listDisputes(
    params: ListDisputesRequest
  ): Promise<ListDisputesResponse> {
    return this.post<ListDisputesResponse>("/disputes", params);
  }

  /**
   * 查询商户的争议列表
   * @param params - 查询参数
   * @returns 争议列表
   * @throws {UnauthorizedError} 当未登录时
   * @throws {ValidationError} 当参数验证失败时
   *
   * @example
   * ```typescript
   * const result = await DisputeService.listMerchantDisputes({
   *   page: 1,
   *   page_size: 20
   * });
   * console.log('商户争议数量:', result.total);
   * ```
   */
  static async listMerchantDisputes(
    params: ListDisputesRequest
  ): Promise<ListDisputesResponse> {
    return this.post<ListDisputesResponse>("/disputes/merchant", params);
  }

  /**
   * 退款审核（商户使用）
   * @param data - 审核请求
   * @returns void
   * @throws {UnauthorizedError} 当未登录时
   * @throws {NotFoundError} 当争议不存在时
   * @throws {ValidationError} 当参数验证失败时
   *
   * @example
   * ```typescript
   * // 同意退款
   * await DisputeService.refundReview({
   *   dispute_id: 123,
   *   status: 'refund'
   * });
   *
   * // 拒绝退款
   * await DisputeService.refundReview({
   *   dispute_id: 123,
   *   status: 'closed',
   *   reason: '不符合退款条件'
   * });
   * ```
   */
  static async refundReview(data: RefundReviewRequest): Promise<void> {
    return this.post("/refund-review", data);
  }

  /**
   * 关闭争议（用户主动关闭）
   * @param data - 关闭争议请求
   * @returns void
   * @throws {UnauthorizedError} 当未登录时
   * @throws {NotFoundError} 当争议不存在时
   *
   * @example
   * ```typescript
   * await DisputeService.closeDispute({
   *   dispute_id: 123
   * });
   * ```
   */
  static async closeDispute(data: CloseDisputeRequest): Promise<void> {
    return this.post("/dispute/close", data);
  }
}
