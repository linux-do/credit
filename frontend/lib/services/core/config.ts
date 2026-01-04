/**
 * API 配置
 */

/**
 * 获取 API 基础 URL
 * @returns API 基础 URL
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_LINUX_DO_CREDIT_BACKEND_URL || "";
}

/**
 * API 配置选项
 */
export const apiConfig = {
  /** Basic URL */
  baseURL: getApiBaseUrl(),
  /** 超时时间（毫秒） */
  timeout: 15000,
  /** 携带凭证 */
  withCredentials: true,
} as const;
