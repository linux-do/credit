"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import services, { type MerchantAPIKey, type CreateAPIKeyRequest, type UpdateAPIKeyRequest } from "@/lib/services"

interface MerchantDialogProps {
  /** 模式：创建或更新 */
  mode: 'create' | 'update'
  /** API Key*/
  apiKey?: MerchantAPIKey
  /** 创建成功回调 */
  onSuccess: (newKey: MerchantAPIKey) => void
  /** 更新成功回调 */
  onUpdate?: (updatedKey: MerchantAPIKey) => void
  /** 触发按钮 */
  trigger?: React.ReactNode
  /** 自定义创建函数 */
  createAPIKey?: (data: CreateAPIKeyRequest) => Promise<MerchantAPIKey>
  /** 更新函数 */
  updateAPIKey?: (id: number, data: UpdateAPIKeyRequest) => Promise<void>
}

/**
 * 集市中心应用对话框组件
 * 负责创建和更新集市中心应用的表单和验证逻辑
 */
export function MerchantDialog({
  mode,
  apiKey,
  onSuccess,
  onUpdate,
  trigger,
  createAPIKey,
  updateAPIKey
}: MerchantDialogProps) {
  const [open, setOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState<CreateAPIKeyRequest | UpdateAPIKeyRequest>({
    app_name: '',
    app_homepage_url: '',
    app_description: '',
    redirect_uri: '',
    notify_url: '',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  /**
   * 初始化表单数据
   */
  useEffect(() => {
    if (mode === 'update' && apiKey) {
      setFormData({
        app_name: apiKey.app_name,
        app_homepage_url: apiKey.app_homepage_url,
        app_description: apiKey.app_description,
        redirect_uri: apiKey.redirect_uri,
        notify_url: apiKey.notify_url,
      })
    } else {
      setFormData({
        app_name: '',
        app_homepage_url: '',
        app_description: '',
        redirect_uri: '',
        notify_url: '',
      })
    }
  }, [mode, apiKey])

  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  const resetForm = () => {
    if (mode === 'update' && apiKey) {
      setFormData({
        app_name: apiKey.app_name,
        app_homepage_url: apiKey.app_homepage_url,
        app_description: apiKey.app_description,
        redirect_uri: apiKey.redirect_uri,
        notify_url: apiKey.notify_url,
      })
    } else {
      setFormData({
        app_name: '',
        app_homepage_url: '',
        app_description: '',
        redirect_uri: '',
        notify_url: '',
      })
    }
  }

  const validateForm = (): { valid: boolean; error?: string } => {
    /* 验证必填项 */
    if (!formData.app_name || !formData.app_homepage_url || !formData.notify_url) {
      return { valid: false, error: '请填写所有必填项' }
    }

    /* 验证应用名称长度 */
    if (formData.app_name.length > 20) {
      return { valid: false, error: '应用名称不能超过 20 个字符' }
    }

    /* 验证应用主页 URL */
    if (!isValidUrl(formData.app_homepage_url)) {
      return { valid: false, error: '应用主页 URL 格式不正确' }
    }

    /* 验证回调 URI */
    if (formData.redirect_uri && !isValidUrl(formData.redirect_uri)) {
      return { valid: false, error: '回调 URI 格式不正确' }
    }

    /* 验证通知 URL */
    if (!isValidUrl(formData.notify_url)) {
      return { valid: false, error: '通知 URL 格式不正确' }
    }

    /* 验证应用描述长度 */
    if (formData.app_description && formData.app_description.length > 100) {
      return { valid: false, error: '应用描述不能超过 100 个字符' }
    }

    return { valid: true }
  }

  const handleSubmit = async () => {
    const validation = validateForm()
    if (!validation.valid) {
      toast.error('表单验证失败', {
        description: validation.error
      })
      return
    }

    try {
      setProcessing(true)

      if (mode === 'create') {
        const newKey = await (createAPIKey ? createAPIKey(formData as CreateAPIKeyRequest) : services.merchant.createAPIKey(formData as CreateAPIKeyRequest))

        toast.success('创建成功', {
          description: '新应用已创建，请妥善保管您的 Client Secret'
        })

        onSuccess(newKey)
      } else if (mode === 'update' && apiKey) {
        if (updateAPIKey) {
          await updateAPIKey(apiKey.id, formData as UpdateAPIKeyRequest)
        } else {
          await services.merchant.updateAPIKey(apiKey.id, formData as UpdateAPIKeyRequest)
        }

        toast.success('更新成功', {
          description: '应用信息已更新'
        })

        /* 更新本地状态 */
        const updatedKey = { ...apiKey, ...formData }
        onUpdate?.(updatedKey)
      }

      setOpen(false)
      resetForm()
    } catch (error) {
      const errorMessage = (error as Error).message || `无法${ mode === 'create' ? '创建' : '更新' }应用`
      toast.error(`${ mode === 'create' ? '创建' : '更新' }失败`, {
        description: errorMessage
      })
      throw error
    } finally {
      setProcessing(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !processing) {
      resetForm()
    }
    setOpen(newOpen)
  }

  if (!mounted) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90 h-8 text-xs">
            {mode === 'create' ? '创建应用' : '更新应用'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? '创建应用' : '更新应用信息'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? '您可以创建一个集市中心应用来接入积分服务，请仔细填写以下信息' : '修改集市中心应用的基本信息和配置'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="app_name">应用名称 <span className="text-red-500">*</span></Label>
            <Input
              id="app_name"
              placeholder="您的应用名称"
              maxLength={20}
              value={formData.app_name}
              onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
              disabled={processing}
            />
            <p className="text-xs text-muted-foreground">最多 20 个字符，用于标识您的应用</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="app_description">应用描述</Label>
            <Input
              id="app_description"
              placeholder="您的应用描述"
              maxLength={100}
              value={formData.app_description}
              onChange={(e) => setFormData({ ...formData, app_description: e.target.value })}
              disabled={processing}
            />
            <p className="text-xs text-muted-foreground">最多 100 个字符，用于描述您的应用，可选</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="app_homepage_url">应用主页 URL <span className="text-red-500">*</span></Label>
            <Input
              id="app_homepage_url"
              type="url"
              placeholder="https://credit.linux.do"
              maxLength={100}
              value={formData.app_homepage_url}
              onChange={(e) => setFormData({ ...formData, app_homepage_url: e.target.value })}
              disabled={processing}
            />
            <p className="text-xs text-muted-foreground">URL 必须为包含 http:// 或 https:// ，用于展示您的应用主页</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notify_url">通知 URL <span className="text-red-500">*</span></Label>
            <Input
              id="notify_url"
              type="url"
              placeholder="https://credit.linux.do/notify"
              maxLength={100}
              value={formData.notify_url}
              onChange={(e) => setFormData({ ...formData, notify_url: e.target.value })}
              disabled={processing}
            />
            <p className="text-xs text-muted-foreground">URL 必须为包含 http:// 或 https:// ，用于接收积分服务成功的异步通知</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="redirect_uri">回调 URI</Label>
            <Input
              id="redirect_uri"
              type="url"
              placeholder="https://credit.linux.do/callback"
              maxLength={100}
              value={formData.redirect_uri}
              onChange={(e) => setFormData({ ...formData, redirect_uri: e.target.value })}
              disabled={processing}
            />
            <p className="text-xs text-muted-foreground">URL 必须为包含 http:// 或 https:// ，用于接收积分服务完成后的回调，可选</p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={processing} className="h-8 text-xs">取消</Button>
          </DialogClose>
          <Button
            onClick={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            disabled={processing}
            className="bg-primary hover:bg-primary/90 h-8 text-xs"
          >
            {processing ? <><Spinner /> {mode === 'create' ? '创建中' : '更新中'}</> : (mode === 'create' ? '创建' : '更新')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
