/**
 * 管理员服务模块
 *
 * @description
 * 提供系统配置和用户积分配置管理功能，包括：
 * - 系统配置管理（创建、查询、更新、删除）
 * - 用户积分配置管理（创建、查询、更新、删除）
 *
 * @remarks
 * 所有接口都需要管理员权限
 *
 * @example
 * ```typescript
 * import { AdminService } from '@/lib/services';
 *
 * // 获取系统配置列表
 * const configs = await AdminService.listSystemConfigs();
 *
 * // 创建用户积分配置
 * await AdminService.createUserPayConfig({
 *   level: 1,
 *   min_score: 0,
 *   max_score: 999,
 *   daily_limit: 10000,
 *   fee_rate: 0.01
 * });
 * ```
 */

export { AdminService } from "./admin.service";
export type {
  SystemConfig,
  CreateSystemConfigRequest,
  UpdateSystemConfigRequest,
  UserPayConfig,
  CreateUserPayConfigRequest,
  UpdateUserPayConfigRequest,
  TaskMeta,
  DispatchTaskRequest,
  AdminUser,
  ListUsersRequest,
  ListUsersResponse,
  UpdateUserStatusRequest,
} from "./types";
