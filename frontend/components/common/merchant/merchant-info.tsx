import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Copy, Eye, EyeOff, Trash2, ExternalLink, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MerchantDialog } from "@/components/common/merchant/merchant-dialog"
import { TestModeToggle } from "@/components/common/merchant/merchant-test"
import { DistributeDialog } from "@/components/common/merchant/merchant-distribute"
import { formatDateTime } from "@/lib/utils"
import { type UpdateAPIKeyRequest, type MerchantAPIKey } from "@/lib/services"

interface MerchantInfoProps {
  /** API Key */
  apiKey: MerchantAPIKey
  /** 更新回调 */
  onUpdate?: (updatedKey: MerchantAPIKey) => void
  /** 删除回调 */
  onDelete: (id: string) => void
  /** 更新 API Key */
  updateAPIKey?: (id: string, data: UpdateAPIKeyRequest) => Promise<void>
}

/**
 * 集市中心应用信息组件
 * 显示集市中心应用的凭证信息（Client ID 和 Secret）
 */
export function MerchantInfo({ apiKey, onUpdate, onDelete, updateAPIKey }: MerchantInfoProps) {
  const [showClientId, setShowClientId] = useState(false)
  const [showClientSecret, setShowClientSecret] = useState(false)

  /* 复制到剪贴板 */
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${ label } 已复制`)
    } catch {
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.select()
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)

        if (successful) {
          toast.success(`${ label } 已复制`)
        } else {
          toast.error('复制失败')
        }
      } catch {
        toast.error('复制失败')
      }
    }
  }

  const maskText = (text: string, showLength: number = 8) => {
    if (text.length <= showLength * 2) return text
    return `${ text.substring(0, showLength) }${ '•'.repeat(20) }${ text.substring(text.length - showLength) }`
  }

  return (
    <div className="space-y-6 sticky top-0">
      <div>
        <h2 className="font-semibold mb-4">应用信息</h2>
        <div className="border border-dashed rounded-lg">
          <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
            <label className="text-xs font-medium text-muted-foreground">应用名称</label>
            <div className="flex items-center gap-2 max-w-[70%]">
              <p className="text-xs font-medium truncate">{apiKey.app_name}</p>
              {apiKey.test_mode && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-500/10 text-orange-600 border border-orange-500/20">
                  测试
                </span>
              )}
            </div>
          </div>

          {apiKey.app_description && (
            <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
              <label className="text-xs font-medium text-muted-foreground">应用描述</label>
              <p className="text-xs text-muted-foreground truncate text-right max-w-[70%]">{apiKey.app_description}</p>
            </div>
          )}

          <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
            <label className="text-xs font-medium text-muted-foreground">创建时间</label>
            <p className="text-xs text-muted-foreground text-right max-w-[70%]">{formatDateTime(apiKey.created_at)}</p>
          </div>

          <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
            <label className="text-xs font-medium text-muted-foreground">应用地址</label>
            <Link
              href={apiKey.app_homepage_url}
              target="_blank"
              className="text-xs text-indigo-500 hover:underline flex items-center gap-1 text-right max-w-[70%]"
            >
              <span className="truncate flex-1 min-w-0">
                {apiKey.app_homepage_url}
              </span>
              <ExternalLink className="size-3 flex-shrink-0 ml-1" />
            </Link>
          </div>

          {apiKey.redirect_uri && (
            <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
              <label className="text-xs font-medium text-muted-foreground">回调 URI</label>
              <Link
                href={apiKey.redirect_uri}
                target="_blank"
                className="text-xs text-indigo-500 hover:underline flex items-center gap-1 text-right max-w-[70%]"
              >
                <span className="truncate flex-1 min-w-0">
                  {apiKey.redirect_uri}
                </span>
                <ExternalLink className="size-3 flex-shrink-0 ml-1" />
              </Link>
            </div>
          )}

          <div className="px-3 py-2 flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">通知 URL</label>
            <Link
              href={apiKey.notify_url}
              target="_blank"
              className="text-xs text-indigo-500 hover:underline flex items-center gap-1 text-right max-w-[70%]"
            >
              <span className="truncate flex-1 min-w-0">
                {apiKey.notify_url}
              </span>
              <ExternalLink className="size-3 flex-shrink-0 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-4">API 配置</h2>
        <div className="border border-dashed rounded-lg px-3 py-2 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">Client ID</label>
              <span className="text-[10px] text-muted-foreground">客户端标识</span>
            </div>
            <div className="flex items-center p-2 h-8 border border-dashed rounded-sm">
              <code className="text-xs text-muted-foreground font-mono flex-1 overflow-x-auto p-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {showClientId ? apiKey.client_id : maskText(apiKey.client_id, 8)}
              </code>
              <Button
                variant="ghost"
                className="size-6 p-1"
                onClick={() => setShowClientId(!showClientId)}
              >
                {showClientId ? <EyeOff className="size-3 text-muted-foreground" /> : <Eye className="size-3 text-muted-foreground" />}
              </Button>
              <Button
                variant="ghost"
                className="size-6 p-1"
                onClick={() => copyToClipboard(apiKey.client_id, 'Client ID')}
              >
                <Copy className="size-3 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">Client Secret</label>
              <span className="text-[10px] text-muted-foreground">客户端密钥</span>
            </div>
            <div className="flex items-center p-2 h-8 border border-dashed rounded-sm">
              <code className="text-xs text-muted-foreground font-mono flex-1 overflow-x-auto p-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {showClientSecret ? apiKey.client_secret : '•'.repeat(40)}
              </code>
              <Button
                variant="ghost"
                className="size-6 p-1"
                onClick={() => setShowClientSecret(!showClientSecret)}
              >
                {showClientSecret ? <EyeOff className="size-3 text-muted-foreground" /> : <Eye className="size-3 text-muted-foreground" />}
              </Button>
              <Button
                variant="ghost"
                onClick={() => copyToClipboard(apiKey.client_secret, 'Client Secret')}
                className="size-6 p-1"
              >
                <Copy className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-4">应用管理</h2>
        <div className="grid grid-cols-2 gap-2">
          <MerchantDialog
            mode="update"
            apiKey={apiKey}
            onSuccess={() => { }}
            onUpdate={onUpdate}
            updateAPIKey={updateAPIKey}
            trigger={
              <Button variant="outline" className="text-xs text-primary h-8 border-dashed border-primary/50 hover:bg-primary/5 w-full">
                <Edit className="size-3 mr-1" />
                编辑应用
              </Button>
            }
          />

          <DistributeDialog />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-xs text-destructive h-8 border-dashed border-destructive/50 hover:bg-destructive/5 w-full">
                <Trash2 className="size-3 mr-1" />
                删除应用
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除应用</AlertDialogTitle>
                <AlertDialogDescription>
                  确定要删除应用 &ldquo;{apiKey.app_name}&rdquo; 吗？
                  此操作将永久删除该应用的所有凭证和配置，且无法恢复。
                  使用此应用凭证的所有集成将立即失效。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(apiKey.id)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  确认删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <TestModeToggle
            apiKey={apiKey}
            onUpdate={onUpdate}
            updateAPIKey={updateAPIKey}
          />
        </div>
      </div>
    </div>
  )
}
