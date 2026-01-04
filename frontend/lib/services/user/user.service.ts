import { BaseService } from "../core/base.service";

/**
 * 用户服务
 * 处理用户个人设置相关的 API 请求
 */
export class UserService extends BaseService {
  protected static readonly basePath = "/api/v1/user";

  /**
   * 更新用户支付密钥
   * @param payKey - 新的支付密钥
   * @returns void
   * @throws {UnauthorizedError} 当用户未登录时
   * @throws {ValidationError} 当支付密钥格式无效时
   *
   * @example
   * ```typescript
   * await UserService.updatePayKey('123456');
   * ```
   *
   * @remarks
   * - 支付密钥必须为6位数字
   * - 只能更新当前登录用户的支付密钥
   */
  static async updatePayKey(payKey: string): Promise<void> {
    return this.put<void>("/pay-key", { pay_key: payKey });
  }
}
