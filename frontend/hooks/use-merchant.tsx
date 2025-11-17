"use client"

import { useState, useRef, useCallback } from "react"
import { toast } from "sonner"

import services, { type MerchantAPIKey, type UpdateAPIKeyRequest, isCancelError } from "@/lib/services"


/* 商户数据状态接口 */
interface MerchantDataState {
  apiKeys: MerchantAPIKey[]
  loading: boolean
  error: string | null
}

/* 商户数据 Hook 返回值接口 */
interface UseMerchantDataReturn extends MerchantDataState {
  loadAPIKeys: () => Promise<void>
  createAPIKey: (data: {
    app_name: string
    app_homepage_url: string
    redirect_uri: string
  }) => Promise<MerchantAPIKey>
  updateAPIKey: (id: number, data: UpdateAPIKeyRequest) => Promise<void>
  deleteAPIKey: (id: number) => Promise<void>
  refresh: () => Promise<void>
}

/**
 * 商户数据管理 Hook
 * 
 * @param {React.ReactNode} children - 商户数据管理 Hook 的子元素
 * @returns {UseMerchantDataReturn} 商户数据管理 Hook 返回值
 * @example
 * ```tsx
 * const { apiKeys, loading, error, loadAPIKeys, createAPIKey, updateAPIKey, deleteAPIKey, refresh } = useMerchantData()
 * ```
 */
export function useMerchantData(): UseMerchantDataReturn {
  const [state, setState] = useState<MerchantDataState>({
    apiKeys: [],
    loading: true,
    error: null,
  })

  const hasLoadedRef = useRef(false)

  /* 加载 API Keys */
  const loadAPIKeys = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const data = await services.merchant.listAPIKeys()
      const validKeys = Array.isArray(data) ? data.filter(key => key != null) : []

      setState(prev => ({
        ...prev,
        apiKeys: validKeys,
        loading: false,
        error: null
      }))

      hasLoadedRef.current = true
    } catch (error) {
      if (isCancelError(error)) {
        return
      }

      const errorMessage = (error as Error).message || '无法加载 API Keys'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))

      toast.error('加载失败', {
        description: errorMessage
      })
    }
  }, [])

  /* 创建 API Key */
  const createAPIKey = useCallback(async (data: {
    app_name: string
    app_homepage_url: string
    redirect_uri: string
  }): Promise<MerchantAPIKey> => {
    const newKey = await services.merchant.createAPIKey(data)

    setState(prev => ({
      ...prev,
      apiKeys: [newKey, ...prev.apiKeys]
    }))

    return newKey
  }, [])

  /* 更新 API Key */
  const updateAPIKey = useCallback(async (id: number, data: UpdateAPIKeyRequest): Promise<void> => {
    await services.merchant.updateAPIKey(id, data)

    setState(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.map(key =>
        key.id === id ? { ...key, ...data } : key
      )
    }))
  }, [])

  /* 删除 API Key */
  const deleteAPIKey = useCallback(async (id: number) => {
    await services.merchant.deleteAPIKey(id)

    setState(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.filter(key => key && key.id !== id)
    }))
  }, [])

  /* 刷新数据 */
  const refresh = useCallback(async () => {
    hasLoadedRef.current = false
    await loadAPIKeys()
  }, [loadAPIKeys])

  return {
    ...state,
    loadAPIKeys,
    createAPIKey,
    updateAPIKey,
    deleteAPIKey,
    refresh,
  }
}
