import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(dateStr: string | Date) {
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date)
  } catch {
    return String(dateStr)
  }
}

/**
 * 格式化日期为本地时间字符串（带时区）
 * @param date 要格式化的日期
 * @returns 格式化后的日期字符串，如 "2024-01-15T00:00:00+08:00"
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${ year }-${ month }-${ day }T${ hours }:${ minutes }:${ seconds }+08:00`
}

/**
 * 生成交易缓存的唯一键
 * @param params 交易查询参数
 * @returns 缓存键字符串
 */
export function generateTransactionCacheKey(params: {
  type?: string
  status?: string
  client_id?: string
  page?: number
  page_size?: number
  startTime?: string
  endTime?: string
  id?: number
  order_name?: string
  payer_username?: string
  payee_username?: string
}): string {
  const typeKey = params.type || 'all'
  const statusKey = params.status || 'all'
  const clientIdKey = params.client_id || 'all'
  const startTimeKey = params.startTime || 'no-start'
  const endTimeKey = params.endTime || 'no-end'
  const idKey = params.id || 'no-id'
  const orderNameKey = params.order_name || 'no-name'
  const payerKey = params.payer_username || 'no-payer'
  const payeeKey = params.payee_username || 'no-payee'

  return `${ typeKey }_${ statusKey }_${ clientIdKey }_${ params.page }_${ params.page_size }_${ startTimeKey }_${ endTimeKey }_${ idKey }_${ orderNameKey }_${ payerKey }_${ payeeKey }`
}
