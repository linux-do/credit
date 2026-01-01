"use client"

import * as React from "react"
import { createContext, useContext, useState, useRef, useCallback } from "react"

import services from "@/lib/services"
import type { UpdateUserPayConfigRequest } from "@/lib/services/admin/types"
import type { UserPayConfig, SystemConfig, UpdateSystemConfigRequest } from "@/lib/services"
import { handleContextError } from "@/lib/utils/error-handling"


/** Admin 上下文状态接口 */
export interface AdminContextState {
  userPayConfigs: UserPayConfig[]
  userPayConfigsLoading: boolean
  userPayConfigsError: Error | null
  refetchUserPayConfigs: () => Promise<void>
  updateUserPayConfig: (id: string, data: UpdateUserPayConfigRequest) => Promise<void>
  deleteUserPayConfig: (id: string) => Promise<void>

  systemConfigs: SystemConfig[]
  systemConfigsLoading: boolean
  systemConfigsError: Error | null
  refetchSystemConfigs: () => Promise<void>
  updateSystemConfig: (key: string, data: UpdateSystemConfigRequest) => Promise<void>
  deleteSystemConfig: (key: string) => Promise<void>
}

const AdminContext = createContext<AdminContextState | null>(null)

/**
 * Admin Provider
 * 提供 admin 相关的数据状态管理
 * 
 * @example
 * ```tsx
 * <AdminProvider>
 *   <div>内容</div>
 * </AdminProvider>
 * ```
 * @param {React.ReactNode} children - Admin Provider 的子元素
 */
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [userPayConfigs, setUserPayConfigs] = useState<UserPayConfig[]>([])
  const [userPayConfigsLoading, setUserPayConfigsLoading] = useState(false)
  const [userPayConfigsError, setUserPayConfigsError] = useState<Error | null>(null)

  const [systemConfigs, setSystemConfigs] = useState<SystemConfig[]>([])
  const [systemConfigsLoading, setSystemConfigsLoading] = useState(false)
  const [systemConfigsError, setSystemConfigsError] = useState<Error | null>(null)

  const userPayRequestIdRef = useRef(0)
  const systemRequestIdRef = useRef(0)

  /** 获取用户积分配置列表 */
  const refetchUserPayConfigs = useCallback(async () => {
    const requestId = ++userPayRequestIdRef.current

    try {
      setUserPayConfigsLoading(true)
      setUserPayConfigsError(null)
      const data = await services.admin.listUserPayConfigs()

      if (requestId !== userPayRequestIdRef.current) {
        return
      }

      setUserPayConfigs(data)
      setUserPayConfigsLoading(false)
    } catch (error) {
      if (requestId !== userPayRequestIdRef.current) {
        return
      }

      const errorObject = handleContextError(error, '加载积分配置失败', { logError: true })
      setUserPayConfigsError(errorObject)
      setUserPayConfigsLoading(false)
    }
  }, [])


  /** 更新用户积分配置 */
  const updateUserPayConfig = useCallback(async (id: string, data: UpdateUserPayConfigRequest) => {
    try {
      await services.admin.updateUserPayConfig(id, data)
      await refetchUserPayConfigs()
    } catch (error) {
      handleContextError(error, '更新用户积分配置失败')
      throw error
    }
  }, [refetchUserPayConfigs])

  /** 删除用户积分配置 */
  const deleteUserPayConfig = useCallback(async (id: string) => {
    await services.admin.deleteUserPayConfig(id)
    await refetchUserPayConfigs()
  }, [refetchUserPayConfigs])

  /** 获取系统配置列表 */
  const refetchSystemConfigs = useCallback(async () => {
    const requestId = ++systemRequestIdRef.current

    try {
      setSystemConfigsLoading(true)
      setSystemConfigsError(null)
      const data = await services.admin.listSystemConfigs()

      if (requestId !== systemRequestIdRef.current) {
        return
      }

      setSystemConfigs(data)
      setSystemConfigsLoading(false)
    } catch (error) {
      if (requestId !== systemRequestIdRef.current) {
        return
      }

      const errorObject = handleContextError(error, '加载系统配置失败', { logError: true })
      setSystemConfigsError(errorObject)
      setSystemConfigsLoading(false)
    }
  }, [])

  /** 更新系统配置 */
  const updateSystemConfig = useCallback(async (key: string, data: UpdateSystemConfigRequest) => {
    try {
      await services.admin.updateSystemConfig(key, data)
      await refetchSystemConfigs()
    } catch (error) {
      handleContextError(error, '更新系统配置失败')
      throw error
    }
  }, [refetchSystemConfigs])

  /** 删除系统配置 */
  const deleteSystemConfig = useCallback(async (key: string) => {
    await services.admin.deleteSystemConfig(key)
    await refetchSystemConfigs()
  }, [refetchSystemConfigs])

  const value: AdminContextState = {
    userPayConfigs,
    userPayConfigsLoading,
    userPayConfigsError,
    refetchUserPayConfigs,
    updateUserPayConfig,
    deleteUserPayConfig,

    systemConfigs,
    systemConfigsLoading,
    systemConfigsError,
    refetchSystemConfigs,
    updateSystemConfig,
    deleteSystemConfig,
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  )
}

/**
 * 使用 Admin 上下文
 * 
 * @example
 * ```tsx
 * const { userPayConfigs, systemConfigs } = useAdmin()
 * ```
 * @returns {AdminContextState} Admin 上下文状态
 */
export function useAdmin() {
  const context = useContext(AdminContext)

  if (!context) {
    throw new Error('useAdmin 必须在 AdminProvider 内部使用')
  }

  return context
}
