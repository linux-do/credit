import { BaseService } from '../core/base.service';
import type {
  CreateRedEnvelopeRequest,
  CreateRedEnvelopeResponse,
  ClaimRedEnvelopeRequest,
  ClaimRedEnvelopeResponse,
  RedEnvelopeDetailResponse,
  RedEnvelopeListParams,
  RedEnvelopeListResponse,
} from './types';

/**
 * 红包服务
 * 处理红包创建、领取、查询相关的 API 请求
 */
export class RedEnvelopeService extends BaseService {
  protected static readonly basePath = '/api/v1/redenvelope';

  /**
   * 创建红包
   * @param data - 创建红包请求参数
   * @returns 红包信息（包含分享链接）
   * @throws {UnauthorizedError} 当未登录时
   * @throws {ValidationError} 当参数验证失败时
   * @throws {ApiErrorBase} 当余额不足或支付密码错误时
   *
   * @example
   * ```typescript
   * const result = await RedEnvelopeService.create({
   *   type: 'random',
   *   total_amount: 100,
   *   total_count: 10,
   *   greeting: '恭喜发财',
   *   pay_key: '123456'
   * });
   * console.log('分享链接:', result.link);
   * ```
   */
  static async create(data: CreateRedEnvelopeRequest): Promise<CreateRedEnvelopeResponse> {
    return this.post<CreateRedEnvelopeResponse>('/create', data);
  }

  /**
   * 领取红包
   * @param data - 领取红包请求参数
   * @returns 领取结果（包含领取金额）
   * @throws {UnauthorizedError} 当未登录时
   * @throws {NotFoundError} 当红包不存在时
   * @throws {ApiErrorBase} 当红包已领完、已过期或已领取过时
   *
   * @example
   * ```typescript
   * const result = await RedEnvelopeService.claim({ id: '123456' });
   * console.log('领取金额:', result.amount);
   * ```
   */
  static async claim(data: ClaimRedEnvelopeRequest): Promise<ClaimRedEnvelopeResponse> {
    return this.post<ClaimRedEnvelopeResponse>('/claim', data);
  }

  /**
   * 获取红包详情
   * @param id - 红包ID
   * @returns 红包详情（包含领取记录）
   * @throws {NotFoundError} 当红包不存在时
   *
   * @example
   * ```typescript
   * const detail = await RedEnvelopeService.getDetail('123456');
   * console.log('红包状态:', detail.red_envelope.status);
   * console.log('已领取人数:', detail.claims.length);
   * ```
   */
  static async getDetail(id: string): Promise<RedEnvelopeDetailResponse> {
    return this.get<RedEnvelopeDetailResponse>(`/${id}`);
  }

  /**
   * 获取红包列表
   * @param params - 查询参数
   * @returns 红包列表
   * @throws {UnauthorizedError} 当未登录时
   *
   * @example
   * ```typescript
   * const result = await RedEnvelopeService.getList({
   *   page: 1,
   *   page_size: 20,
   *   type: 'sent'
   * });
   * ```
   */
  static async getList(params: RedEnvelopeListParams): Promise<RedEnvelopeListResponse> {
    return this.post<RedEnvelopeListResponse>('/list', params);
  }
}