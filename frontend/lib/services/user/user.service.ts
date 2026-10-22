import { BaseService } from '../core/base.service';
import type { PublicAccountsResponse } from './types';

/**
 * 用户服务
 * 处理用户个人设置相关的 API 请求
 */
export class UserService extends BaseService {
  protected static readonly basePath = '/api/v1/user';

  /**
   * 更新用户支付密钥
   * @param payKey - 新的支付密钥
   * @param currentPayKey - 当前支付密钥（已设置支付密钥时必填）
   * @returns void
   * @throws {UnauthorizedError} 当用户未登录时
   * @throws {ValidationError} 当支付密钥格式无效时
   *
   * @example
   * ```typescript
   * await UserService.updatePayKey('654321', '123456');
   * ```
   *
   * @remarks
   * - 支付密钥必须为6位数字
   * - 只能更新当前登录用户的支付密钥
   */
  static async updatePayKey(payKey: string, currentPayKey?: string): Promise<void> {
    return this.put<void>('/pay-key', {
      pay_key: payKey,
      ...(currentPayKey ? { current_pay_key: currentPayKey } : {}),
    });
  }

  /**
   * 获取当前用户的公共账号绑定状态
   * @returns 公共账号绑定状态
   * @throws {UnauthorizedError} 当未登录时
   */
  static async getPublicAccounts(): Promise<PublicAccountsResponse> {
    return this.get<PublicAccountsResponse>('/public-accounts');
  }

  /**
   * 切换到已绑定的公共账号身份
   * @param publicUserId - 目标公共账号 ID
   * @returns void
   * @throws {UnauthorizedError} 当未登录时
   *
   * @remarks
   * - 切换后 session 身份变为公共账号，恢复原身份需退出登录后重新登录
   */
  static async switchPublicAccount(publicUserId: string): Promise<void> {
    return this.post<void>('/public-accounts/switch', { public_user_id: publicUserId });
  }
}
