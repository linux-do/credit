import { BaseService } from "../core/base.service";
import type { PublicConfigResponse } from "./types";
import type { UserPayConfig } from "../admin/types";

/**
 * 配置服务
 * 处理系统公共配置相关的 API 请求
 */
export class ConfigService extends BaseService {
  protected static readonly basePath = "/api/v1/config";

  /**
   * 获取公共配置
   * @returns 公共配置信息
   *
   * @example
   * ```typescript
   * const config = await ConfigService.getPublicConfig();
   * console.log('争议时间窗口:', config.dispute_time_window_hours, '小时');
   * ```
   */
  static async getPublicConfig(): Promise<PublicConfigResponse> {
    return this.get<PublicConfigResponse>("/public");
  }

  /**
   * 获取用户平台等级配置（公开接口）
   * 返回所有平台等级的配置信息，用于向用户展示不同等级的权益
   *
   * @returns 用户支付配置列表
   *
   * @example
   * ```typescript
   * const payConfigs = await ConfigService.getUserPayConfigs();
   * payConfigs.forEach(config => {
   *   console.log(`等级 ${config.level}: 手续费率 ${config.fee_rate}, 每日限额 ${config.daily_limit}`);
   * });
   * ```
   */
  static async getUserPayConfigs(): Promise<UserPayConfig[]> {
    return this.get<UserPayConfig[]>("/user-pay");
  }
}
