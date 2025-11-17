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
 * 商户主页面组件
 * 负责组装商户中心的各个子组件
 */
export function MerchantMain() {
  const { apiKeys, error, loadAPIKeys, createAPIKey, updateAPIKey, deleteAPIKey } = useMerchant()
  const [selectedKeyId, setSelectedKeyId] = useState<number | null>(null)

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

  /* 更新成功回调 */
  const handleUpdate = async (updatedKey: MerchantAPIKey) => {
    try {
      await updateAPIKey(updatedKey.id, {
        app_name: updatedKey.app_name,
        app_homepage_url: updatedKey.app_homepage_url,
        app_description: updatedKey.app_description,
        redirect_uri: updatedKey.redirect_uri,
      })

      toast.success('更新成功', {
        description: '应用信息已更新'
      })

    } catch (error) {
      toast.error('更新失败', {
        description: (error as Error).message || '无法更新应用'
      })
    }
  }

  /* 删除成功回调 */
  const handleDelete = async (id: number) => {
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

  /* 等待加载 API Keys */
  if (apiKeys.length === 0) {
    return <LoadingPage text="商户中心" badgeText="商户" />
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
        <h1 className="text-2xl font-semibold">商户中心</h1>
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
        >
          <EmptyState
            title="商户应用列表为空"
            description="请创建您的第一个商户应用，以便开始接入支付功能"
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
                <MerchantInfo apiKey={selectedKey} onUpdate={handleUpdate} onDelete={handleDelete}/>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
