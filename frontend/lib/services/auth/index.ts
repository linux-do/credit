/**
 * 认证服务模块
 *
 * @description
 * 提供 OAuth 认证相关的功能，包括：
 * - 获取登录 URL
 * - 处理 OAuth 回调
 * - 获取用户信息
 * - 用户登出
 * - 发起登录流程
 *
 * @example
 * ```typescript
 * import { AuthService } from '@/lib/services';
 *
 * // 发起登录
 * await AuthService.initiateLogin();
 *
 * // 获取用户信息
 * const user = await AuthService.getUserInfo();
 * console.log('当前用户:', user.username);
 *
 * // 登出
 * await AuthService.logout();
 * ```
 */

export { AuthService } from "./auth.service";
export { TrustLevel, PayLevel } from "./types";
export type {
  User,
  OAuthLoginUrlResponse,
  OAuthCallbackRequest,
} from "./types";
