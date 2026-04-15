/**
 * 公共配置响应
 */
export interface PublicConfigResponse {
  /** 争议时间窗口（小时） */
  dispute_time_window_hours: number;
  /** 红包功能是否启用 */
  red_envelope_enabled: boolean;
  /** 单个红包的最大积分上限 */
  red_envelope_max_amount: string;
  /** 每日发红包的个数限制 */
  red_envelope_daily_limit: number;
  /** 红包手续费率（0-1之间的小数） */
  red_envelope_fee_rate: string;
  /** 每个红包的最大可领取人数上限 */
  red_envelope_max_recipients: number;
  /** 到账最短时间 **/
  settlement_delay_days_min: number;
  /** 到账最长时间 **/
  settlement_delay_days_max: number;
}
