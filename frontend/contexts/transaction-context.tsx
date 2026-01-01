"use client"

import * as React from "react"
import { createContext, useContext, useCallback, useState, useRef, useEffect } from "react"

import services from "@/lib/services"
import type { Order, TransactionQueryParams } from "@/lib/services"
import { generateTransactionCacheKey } from "@/lib/utils"


/** 交易上下文状态接口 */
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
  goToPage: (page: number) => Promise<void>
  setPageSize: (size: number) => void
  refresh: () => Promise<void>
  clearCacheAndRefresh: () => Promise<void>
  reset: () => void
  updateOrderStatus: (orderId: string, updates: Partial<Pick<Order, 'status' | 'dispute_id'>>) => void
}

const MAX_CACHE_SIZE = 50
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟

/** 交易上下文 */
const TransactionContext = createContext<TransactionContextState | null>(null)

/** 交易 Provider Props 接口 */
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

  /** 使用 useRef 存储缓存 */
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

  /** 获取交易列表 */
  const fetchTransactions = useCallback(async (params: Partial<TransactionQueryParams>) => {
    const queryParams: TransactionQueryParams = {
      page: params.page || 1,
      page_size: params.page_size || pageSize,
      ...params,
    }

    /** 生成唯一的请求 ID */
    const requestId = ++latestRequestIdRef.current

    /** 生成缓存key */
    const cacheKey = generateTransactionCacheKey(queryParams as Parameters<typeof generateTransactionCacheKey>[0])

    const cached = cacheRef.current[cacheKey]
    const now = Date.now()

    /** 缓存所有页面，不仅仅第一页 */
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      if (requestId !== latestRequestIdRef.current) {
        return
      }

      /** 使用缓存数据，同步更新状态 */
      setTransactions(cached.data)
      setTotal(cached.total)
      setCurrentPage(queryParams.page)
      setPageSize(queryParams.page_size)
      setLastParams(prev => ({ ...prev, ...params }))
      setError(null)
      setLoading(false)
      return
    }

    /** 发起API请求 */
    setLoading(true)
    setError(null)
    // 不清空 total，保持显示之前的总数
    // setTransactions([]) - 也不清空，保持之前的数据直到新数据到达

    try {
      const result = await services.transaction.getTransactions(queryParams)

      if (requestId !== latestRequestIdRef.current) {
        return
      }

      /** 总是替换数据，不累加 */
      setTransactions(result.orders)

      /** 缓存所有页的数据 */
      addToCache(cacheKey, {
        data: result.orders,
        total: result.total,
        timestamp: now
      })
      cleanExpiredCache()

      setTotal(result.total)
      setCurrentPage(queryParams.page)
      setPageSize(queryParams.page_size)
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

  /** 跳转到指定页 */
  const goToPage = useCallback(async (page: number) => {
    if (loading) return
    await fetchTransactions({
      ...lastParams,
      page,
    })
  }, [fetchTransactions, lastParams, loading])

  /** 设置分页大小 */
  const setPageSizeHandler = useCallback((size: number) => {
    setPageSize(size)
    fetchTransactions({
      ...lastParams,
      page: 1,
      page_size: size,
    })
  }, [fetchTransactions, lastParams])

  const refresh = useCallback(async () => {
    const cacheKey = generateTransactionCacheKey({ ...lastParams, page: currentPage, page_size: pageSize } as Parameters<typeof generateTransactionCacheKey>[0])
    delete cacheRef.current[cacheKey]

    await fetchTransactions({
      ...lastParams,
      page: currentPage,
    })
  }, [fetchTransactions, lastParams, pageSize, currentPage])

  /** 清除所有缓存并刷新 */
  const clearCacheAndRefresh = useCallback(async () => {
    cacheRef.current = {}
    await fetchTransactions({
      ...lastParams,
      page: 1,
    })
  }, [fetchTransactions, lastParams])

  /** 乐观更新订单状态 */
  const updateOrderStatus = useCallback((orderId: string, updates: Partial<Pick<Order, 'status' | 'dispute_id'>>) => {
    setTransactions(prev =>
      prev.map(order =>
        order.id === orderId
          ? { ...order, ...updates }
          : order
      )
    )

    cacheRef.current = {}
  }, [])

  /** 重置状态 */
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
    goToPage,
    setPageSize: setPageSizeHandler,
    refresh,
    clearCacheAndRefresh,
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
