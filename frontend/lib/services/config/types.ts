/**
 * 公共配置响应
 */
export interface PublicConfigResponse {
  /** 争议时间窗口（小时） */
  dispute_time_window_hours: number;
  /** 红包功能是否启用（1启用，0禁用） */
  red_envelope_enabled: number;
  /** 单个红包的最大积分上限 */
  red_envelope_max_amount: string;
  /** 每日发红包的个数限制 */
  red_envelope_daily_limit: number;
  /** 红包手续费率（0-1之间的小数） */
  red_envelope_fee_rate: string;
}
