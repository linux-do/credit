/**
 * 用户服务模块
 *
 * @description
 * 提供用户个人设置相关的功能，包括：
 * - 更新支付密钥
 *
 * @example
 * ```typescript
 * import { UserService } from '@/lib/services';
 *
 * // 更新支付密钥
 * await UserService.updatePayKey('123456');
 * ```
 */

export { UserService } from "./user.service";
export type { UpdatePayKeyRequest } from "./types";
