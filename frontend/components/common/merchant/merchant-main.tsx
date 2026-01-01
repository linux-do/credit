"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { ErrorDisplay } from "@/components/layout/error"
import { EmptyState } from "@/components/layout/empty"
import { LoadingPage } from "@/components/layout/loading"
import { MerchantSelector } from "@/components/common/merchant/merchant-selector"
import { MerchantInfo } from "@/components/common/merchant/merchant-info"
import { MerchantData } from "@/components/common/merchant/merchant-data"
import { MerchantDialog } from "@/components/common/merchant/merchant-dialog"
import { type MerchantAPIKey } from "@/lib/services"
import { useMerchant } from "@/contexts/merchant-context"

/**
 * 集市中心主页面组件
 * 负责组装集市中心的各个子组件
 */
export function MerchantMain() {
  const { apiKeys, loading, error, loadAPIKeys, createAPIKey, updateAPIKey, deleteAPIKey } = useMerchant()
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)

  const selectedKey = apiKeys.find(key => key.id === selectedKeyId) || null

  /* 加载 API Keys */
  useEffect(() => {
    loadAPIKeys()
  }, [loadAPIKeys])

  /* 选择默认 API Key */
  useEffect(() => {
    if (apiKeys.length > 0 && !selectedKeyId) {
      setSelectedKeyId(apiKeys[0].id)
    }
  }, [apiKeys, selectedKeyId])

  /* 创建成功回调 */
  const handleCreateSuccess = (newKey: MerchantAPIKey) => {
    setSelectedKeyId(newKey.id)
  }

  /* 删除成功回调 */
  const handleDelete = async (id: string) => {
    try {
      await deleteAPIKey(id)
      toast.success('删除成功')

      if (selectedKeyId === id) {
        const remainingKeys = apiKeys.filter(key => key && key.id !== id)
        setSelectedKeyId(remainingKeys.length > 0 ? remainingKeys[0].id : null)
      }
    } catch (error) {
      toast.error('删除失败', {
        description: (error as Error).message || '无法删除应用'
      })
    }
  }

  /* 正在加载中 */
  if (loading) {
    return <LoadingPage text="集市中心" badgeText="集市" />
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <h1 className="text-2xl font-semibold">集市中心</h1>
        <div className="flex items-center gap-3">
          {apiKeys.length > 0 && (
            <MerchantSelector
              apiKeys={apiKeys}
              selectedKeyId={selectedKeyId}
              onSelect={setSelectedKeyId}
            />
          )}
          <MerchantDialog
            mode="create"
            onSuccess={handleCreateSuccess}
            createAPIKey={createAPIKey}
          />
        </div>
      </div>

      {error ? (
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex items-center justify-center min-h-[60vh]"
        >
          <ErrorDisplay
            title="加载失败"
            message={error}
            onRetry={loadAPIKeys}
            retryText="重试"
          />
        </motion.div>
      ) : apiKeys.length === 0 ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex items-center justify-center min-h-[60vh]"
        >
          <EmptyState
            title="应用列表为空"
            description="请创建您的第一个集市应用，开始您的积分服务"
          />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6"
        >
          {selectedKey && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MerchantData apiKey={selectedKey} />
              </div>

              <div className="lg:col-span-1">
                <MerchantInfo
                  apiKey={selectedKey}
                  onDelete={handleDelete}
                  updateAPIKey={updateAPIKey}
                />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
