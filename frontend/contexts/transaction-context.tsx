"use client"

import * as React from "react"
import { createContext, useContext, useCallback, useState, useRef, useEffect } from "react"

import services from "@/lib/services"
import type { Order, TransactionQueryParams } from "@/lib/services"


/* 交易上下文状态接口 */
interface TransactionContextState {
  transactions: Order[]
  total: number
  currentPage: number
  pageSize: number
  totalPages: number
  loading: boolean
  error: Error | null
  lastParams: Partial<TransactionQueryParams>
  fetchTransactions: (params: Partial<TransactionQueryParams>) => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  reset: () => void
  updateOrderStatus: (orderId: number, updates: Partial<Pick<Order, 'status' | 'dispute_id'>>) => void
}

const MAX_CACHE_SIZE = 50
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟

/* 交易上下文 */
const TransactionContext = createContext<TransactionContextState | null>(null)

/* 交易 Provider Props 接口 */
interface TransactionProviderProps {
  children: React.ReactNode
  defaultParams?: Partial<TransactionQueryParams>
}

/**
 * 交易 Provider
 * 提供交易数据的全局状态管理
 * 
 * @param {React.ReactNode} children - 交易 Provider 的子元素
 * @param {Partial<TransactionQueryParams>} defaultParams - 默认查询参数
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

  /* 使用 useRef 存储缓存 */
  const cacheRef = useRef<Record<string, { data: Order[], total: number, timestamp: number }>>({})
  const latestRequestIdRef = useRef(0)

  const cleanExpiredCache = useCallback(() => {
    const now = Date.now()
    Object.keys(cacheRef.current).forEach(key => {
      if (now - cacheRef.current[key].timestamp > CACHE_DURATION) {
        delete cacheRef.current[key]
      }
    })
  }, [])

  const addToCache = useCallback((key: string, value: { data: Order[], total: number, timestamp: number }) => {
    const cacheKeys = Object.keys(cacheRef.current)

    if (cacheKeys.length >= MAX_CACHE_SIZE) {
      const oldestKey = cacheKeys.reduce((oldest, current) => {
        return cacheRef.current[current].timestamp < cacheRef.current[oldest].timestamp ? current : oldest
      })
      delete cacheRef.current[oldestKey]
    }

    cacheRef.current[key] = value
  }, [])

  /* 获取交易列表 */
  const fetchTransactions = useCallback(async (params: Partial<TransactionQueryParams>) => {
    const queryParams: TransactionQueryParams = {
      page: params.page || 1,
      page_size: params.page_size || pageSize,
      ...params,
    }

    /* 生成唯一的请求 ID */
    const requestId = ++latestRequestIdRef.current

    /* 生成缓存key */
    const typeKey = queryParams.type || 'all'
    const statusKey = queryParams.status || 'all'
    const clientIdKey = queryParams.client_id || 'all'
    const startTimeKey = queryParams.startTime || 'no-start'
    const endTimeKey = queryParams.endTime || 'no-end'
    const cacheKey = `${ typeKey }_${ statusKey }_${ clientIdKey }_${ queryParams.page }_${ queryParams.page_size }_${ startTimeKey }_${ endTimeKey }`

    const cached = cacheRef.current[cacheKey]
    const now = Date.now()

    if (cached && (now - cached.timestamp) < CACHE_DURATION && queryParams.page === 1) {
      if (requestId !== latestRequestIdRef.current) {
        return
      }

      /* 使用缓存数据，同步更新状态 */
      setTransactions(cached.data)
      setTotal(cached.total)
      setCurrentPage(queryParams.page)
      setPageSize(queryParams.page_size)
      setLastParams(prev => ({ ...prev, ...params }))
      setError(null)
      setLoading(false)
      return
    }

    /* 发起API请求 */
    setLoading(true)
    setError(null)
    if (queryParams.page === 1) {
      setTransactions([])
      setTotal(0)
    }

    try {
      const [result] = await Promise.all([
        services.transaction.getTransactions(queryParams),
        new Promise(resolve => setTimeout(resolve, 300))
      ])

      if (requestId !== latestRequestIdRef.current) {
        return
      }

      if (queryParams.page === 1) {
        setTransactions(result.orders)
        addToCache(cacheKey, {
          data: result.orders,
          total: result.total,
          timestamp: now
        })
        cleanExpiredCache()
      } else {
        setTransactions(prev => [...prev, ...result.orders])
      }

      setTotal(result.total)
      setCurrentPage(result.page)
      setPageSize(result.page_size)
      setLastParams(prev => ({ ...prev, ...params }))
    } catch (err) {
      if (err instanceof Error && err.message === '请求已被取消') {
        return
      }

      if (requestId !== latestRequestIdRef.current) {
        return
      }

      setError(err instanceof Error ? err : new Error('获取交易记录失败'))
      console.error('获取交易记录失败:', err)
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setLoading(false)
      }
    }
  }, [pageSize, addToCache, cleanExpiredCache])

  /* 加载更多 */
  const loadMore = useCallback(async () => {
    if (loading) return

    const nextPage = currentPage + 1
    await fetchTransactions({
      ...lastParams,
      page: nextPage,
    })
  }, [currentPage, fetchTransactions, lastParams, loading])

  /* 刷新当前页 */
  const refresh = useCallback(async () => {
    const typeKey = lastParams.type || 'all'
    const statusKey = lastParams.status || 'all'
    const clientIdKey = lastParams.client_id || 'all'
    const startTimeKey = lastParams.startTime || 'no-start'
    const endTimeKey = lastParams.endTime || 'no-end'
    const cacheKey = `${ typeKey }_${ statusKey }_${ clientIdKey }_1_${ pageSize }_${ startTimeKey }_${ endTimeKey }`
    delete cacheRef.current[cacheKey]

    await fetchTransactions({
      ...lastParams,
      page: 1,
    })
  }, [fetchTransactions, lastParams, pageSize])

  /* 乐观更新订单状态 */
  const updateOrderStatus = useCallback((orderId: number, updates: Partial<Pick<Order, 'status' | 'dispute_id'>>) => {
    setTransactions(prev =>
      prev.map(order =>
        order.id === orderId
          ? { ...order, ...updates }
          : order
      )
    )

    cacheRef.current = {}
  }, [])

  /* 重置状态 */
  const reset = useCallback(() => {
    setTransactions([])
    setTotal(0)
    setCurrentPage(1)
    setPageSize(defaultParams.page_size || 20)
    setError(null)
    setLastParams(defaultParams)
  }, [defaultParams])

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
    updateOrderStatus,
  }

  useEffect(() => {
    return () => {
      cacheRef.current = {}
    }
  }, [])

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  )
}

/**
 * 使用交易上下文
 * 
 * @param {React.ReactNode} children - 交易上下文 Provider 的子元素
 * @param {Partial<TransactionQueryParams>} defaultParams - 默认查询参数

 */
export function useTransaction() {
  const context = useContext(TransactionContext)

  if (!context) {
    throw new Error('useTransaction 必须在 TransactionProvider 内部使用')
  }

  return context
}
