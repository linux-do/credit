"use client"

import * as React from "react"
import { createContext, useContext, useCallback, useState, useRef } from "react"
import type { Order, TransactionQueryParams } from "@/lib/services"
import services from "@/lib/services"

/**
 * 交易上下文状态
 */
interface TransactionContextState {
  /** 交易列表 */
  transactions: Order[]
  /** 总记录数 */
  total: number
  /** 当前页码 */
  currentPage: number
  /** 每页数量 */
  pageSize: number
  /** 总页数 */
  totalPages: number
  /** 加载状态 */
  loading: boolean
  /** 错误信息 */
  error: Error | null
  /** 最后的查询参数 */
  lastParams: Partial<TransactionQueryParams>
  /** 获取交易列表 */
  fetchTransactions: (params: Partial<TransactionQueryParams>) => Promise<void>
  /** 加载更多 */
  loadMore: () => Promise<void>
  /** 刷新当前页 */
  refresh: () => Promise<void>
  /** 重置状态 */
  reset: () => void
}

const TransactionContext = createContext<TransactionContextState | null>(null)

/**
 * 交易 Provider 属性
 */
interface TransactionProviderProps {
  children: React.ReactNode
  /** 默认查询参数 */
  defaultParams?: Partial<TransactionQueryParams>
}

/**
 * 交易 Provider
 * 提供交易数据的全局状态管理
 * 
 * @example
 * ```tsx
 * <TransactionProvider defaultParams={{ type: 'receive', page_size: 20 }}>
 *   <TransactionList />
 * </TransactionProvider>
 * ```
 */
export function TransactionProvider({ children, defaultParams = {} }: TransactionProviderProps) {
  const [transactions, setTransactions] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultParams.page_size || 20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastParams, setLastParams] = useState<Partial<TransactionQueryParams>>(defaultParams)

  // 使用 useRef 存储缓存，避免触发重新渲染和函数重建
  const cacheRef = useRef<Record<string, { data: Order[], total: number, timestamp: number }>>({})

  /**
   * 获取交易列表
   */
  const fetchTransactions = useCallback(async (params: Partial<TransactionQueryParams>) => {
    const queryParams: TransactionQueryParams = {
      page: params.page || 1,
      page_size: params.page_size || pageSize,
      ...params,
    }

    // 生成缓存key（包含时间范围以区分不同的查询）
    const startTimeKey = queryParams.startTime || 'no-start'
    const endTimeKey = queryParams.endTime || 'no-end'
    const cacheKey = `${queryParams.type || 'all'}_${queryParams.page}_${queryParams.page_size}_${startTimeKey}_${endTimeKey}`

    // 检查缓存（缓存5分钟）
    const cached = cacheRef.current[cacheKey]
    const now = Date.now()
    const CACHE_DURATION = 5 * 60 * 1000 // 5分钟

    if (cached && (now - cached.timestamp) < CACHE_DURATION && queryParams.page === 1) {
      // 使用缓存数据，同步更新状态
      setTransactions(cached.data)
      setTotal(cached.total)
      setCurrentPage(queryParams.page)
      setPageSize(queryParams.page_size)
      setLastParams(params)
      setError(null)
      setLoading(false) // 确保loading状态为false
      return
    }

    // 发起API请求
    // 如果是第一页，立即清空旧数据并设置loading
    // 必须先设置loading，再清空数据，确保UI先看到loading状态
    setLoading(true)
    setError(null)
    if (queryParams.page === 1) {
      setTransactions([])
      setTotal(0)
    }

    try {
      // 确保至少显示300ms的loading状态，避免闪烁
      const [result] = await Promise.all([
        services.transaction.getTransactions(queryParams),
        new Promise(resolve => setTimeout(resolve, 300))
      ])

      // 如果是第一页，替换数据并更新缓存；否则追加数据
      if (queryParams.page === 1) {
        setTransactions(result.orders)
        // 更新缓存 (使用 ref 不会触发重新渲染)
        cacheRef.current[cacheKey] = {
          data: result.orders,
          total: result.total,
          timestamp: now
        }
      } else {
        setTransactions(prev => [...prev, ...result.orders])
      }

      setTotal(result.total)
      setCurrentPage(result.page)
      setPageSize(result.page_size)
      setLastParams(params)
    } catch (err) {
      // 忽略请求取消错误
      if (err instanceof Error && err.message === '请求已被取消') {
        return
      }
      setError(err instanceof Error ? err : new Error('获取交易记录失败'))
      console.error('获取交易记录失败:', err)
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  /**
   * 加载更多
   */
  const loadMore = useCallback(async () => {
    if (loading) return
    
    const nextPage = currentPage + 1
    await fetchTransactions({
      ...lastParams,
      page: nextPage,
    })
  }, [currentPage, fetchTransactions, lastParams, loading])

  /**
   * 刷新当前页（清除缓存）
   */
  const refresh = useCallback(async () => {
    // 清除相关缓存（包含时间参数）
    const startTimeKey = lastParams.startTime || 'no-start'
    const endTimeKey = lastParams.endTime || 'no-end'
    const cacheKey = `${lastParams.type || 'all'}_1_${pageSize}_${startTimeKey}_${endTimeKey}`
    delete cacheRef.current[cacheKey]

    await fetchTransactions({
      ...lastParams,
      page: 1,
    })
  }, [fetchTransactions, lastParams, pageSize])

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setTransactions([])
    setTotal(0)
    setCurrentPage(1)
    setPageSize(defaultParams.page_size || 20)
    setError(null)
    setLastParams(defaultParams)
  }, [defaultParams])

  // 计算总页数
  const totalPages = Math.ceil(total / pageSize)

  const value: TransactionContextState = {
    transactions,
    total,
    currentPage,
    pageSize,
    totalPages,
    loading,
    error,
    lastParams,
    fetchTransactions,
    loadMore,
    refresh,
    reset,
  }

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  )
}

/**
 * 使用交易上下文
 * 
 * @example
 * ```tsx
 * function TransactionList() {
 *   const { transactions, loading, fetchTransactions } = useTransaction()
 *   
 *   useEffect(() => {
 *     fetchTransactions({ type: 'receive' })
 *   }, [])
 *   
 *   return (
 *     <div>
 *       {transactions.map(t => <div key={t.order_no}>{t.order_name}</div>)}
 *     </div>
 *   )
 * }
 * ```
 */
export function useTransaction() {
  const context = useContext(TransactionContext)
  
  if (!context) {
    throw new Error('useTransaction 必须在 TransactionProvider 内部使用')
  }
  
  return context
}

