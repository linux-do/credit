"use client"

import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react"

import services, { type MerchantAPIKey, type UpdateAPIKeyRequest } from "@/lib/services"
import { handleContextError } from "@/lib/utils/error-handling"


/** 商户数据状态接口 */
interface MerchantDataState {
  apiKeys: MerchantAPIKey[]
  loading: boolean
  error: string | null
}

/** 商户 Context 接口 */
interface MerchantContextType extends MerchantDataState {
  loadAPIKeys: () => Promise<void>
  createAPIKey: (data: {
    app_name: string
    app_homepage_url: string
    redirect_uri?: string
    notify_url: string
  }) => Promise<MerchantAPIKey>
  updateAPIKey: (id: string, data: UpdateAPIKeyRequest) => Promise<void>
  deleteAPIKey: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

/** 商户 Context（全局状态管理） */
const MerchantContext = createContext<MerchantContextType | undefined>(undefined)

/** 商户 Provider */
export function MerchantProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MerchantDataState>({
    apiKeys: [],
    loading: false,
    error: null,
  })

  /** 使用 ref 来标记是否已经加载过数据（全局级别） */
  const hasLoadedRef = useRef(false)
  const isMountedRef = useRef(true)
  const apiKeysRef = useRef(state.apiKeys)

  /** 同步更新 ref */
  apiKeysRef.current = state.apiKeys

  /** 获取 API Keys */
  const loadAPIKeys = useCallback(async () => {
    if (hasLoadedRef.current && apiKeysRef.current.length > 0) {
      return
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const data = await services.merchant.listAPIKeys()

      if (!isMountedRef.current) return

      const validKeys = Array.isArray(data) ? data.filter(key => key != null) : []

      setState(prev => ({
        ...prev,
        apiKeys: validKeys,
        loading: false,
        error: null
      }))

      hasLoadedRef.current = true
    } catch (error) {
      const errorObject = handleContextError(error, '加载 API Keys 失败', { showToast: true })
      if (errorObject.message === '请求已取消') {
        return
      }

      if (!isMountedRef.current) return

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorObject.message
      }))
    }
  }, [])

  /** 创建 API Key */
  const createAPIKey = useCallback(async (data: {
    app_name: string
    app_homepage_url: string
    redirect_uri?: string
    notify_url: string
  }): Promise<MerchantAPIKey> => {
    const newKey = await services.merchant.createAPIKey(data)

    if (!isMountedRef.current) return newKey

    setState(prev => ({
      ...prev,
      apiKeys: [newKey, ...prev.apiKeys]
    }))

    return newKey
  }, [])

  /** 更新 API Key */
  const updateAPIKey = useCallback(async (id: string, data: UpdateAPIKeyRequest): Promise<void> => {
    await services.merchant.updateAPIKey(id, data)

    if (!isMountedRef.current) return

    /** 更新本地状态中的API Key */
    setState(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.map(key =>
        key.id === id ? { ...key, ...data } : key
      )
    }))
  }, [])

  /** 删除 API Key */
  const deleteAPIKey = useCallback(async (id: string) => {
    await services.merchant.deleteAPIKey(id)

    if (!isMountedRef.current) return

    setState(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.filter(key => key && key.id !== id)
    }))
  }, [])

  /** 刷新数据 */
  const refresh = useCallback(async () => {
    hasLoadedRef.current = false
    await loadAPIKeys()
  }, [loadAPIKeys])

  const value: MerchantContextType = {
    ...state,
    loadAPIKeys,
    createAPIKey,
    updateAPIKey,
    deleteAPIKey,
    refresh,
  }

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return (
    <MerchantContext.Provider value={value}>
      {children}
    </MerchantContext.Provider>
  )
}

/**
 * 使用商户数据 Hook
 * 用于在组件中使用商户数据状态
 * 
 * @example
 * ```tsx
 * const { apiKeys, loading, error, loadAPIKeys, createAPIKey, updateAPIKey, deleteAPIKey, refresh } = useMerchant()
 * ```
 */
export function useMerchant(): MerchantContextType {
  const context = useContext(MerchantContext)
  if (context === undefined) {
    throw new Error('useMerchant must be used within a MerchantProvider')
  }
  return context
}
