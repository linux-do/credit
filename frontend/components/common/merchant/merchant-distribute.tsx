"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ConfigService, MerchantService, type MerchantAPIKey, type UserPayConfig } from "@/lib/services"
import { useUser } from "@/contexts/user-context"

interface DistributeDialogProps {
  /** 自定义触发器 */
  trigger?: React.ReactNode
  /** 商户凭证 */
  apiKey?: Pick<MerchantAPIKey, "client_id" | "client_secret">
}

/**
 * 商户分发对话框
 * 商户向用户分发积分
 */
export function DistributeDialog({ trigger, apiKey }: DistributeDialogProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userPayConfigs, setUserPayConfigs] = useState<UserPayConfig[]>([])

  const [userId, setUserId] = useState("")
  const [username, setUsername] = useState("")
  const [amount, setAmount] = useState("")
  const [remark, setRemark] = useState("")
  const { user } = useUser()

  useEffect(() => {
    const loadUserPayConfigs = async () => {
      try {
        setUserPayConfigs(await ConfigService.getUserPayConfigs())
      } catch {
        // The distribution request remains authoritative if the rate preview cannot load.
      }
    }

    loadUserPayConfigs()
  }, [])

  const distributeRate = userPayConfigs.find(
    (config) => user?.pay_level !== undefined && config.level === user.pay_level,
  )?.distribute_rate
  const distributeRatePercent = distributeRate === undefined
    ? null
    : Number(distributeRate) * 100
  const distributionAmount = Number(amount)
  const recipientAmount = Number.isFinite(distributionAmount) && distributeRatePercent !== null
    ? distributionAmount - Math.round(distributionAmount * (distributeRatePercent / 100) * 100) / 100
    : null

  const resetForm = () => {
    setUserId("")
    setUsername("")
    setAmount("")
    setRemark("")
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !loading) {
      resetForm()
    }
    if (!newOpen) {
      setConfirmOpen(false)
    }
    setOpen(newOpen)
  }

  const validateForm = (): string | null => {
    if (!userId.trim()) {
      return '请填写用户 ID'
    }

    if (!username.trim()) {
      return '请填写用户名'
    }

    if (!amount.trim()) {
      return '请填写分发金额'
    }

    if (!Number.isFinite(distributionAmount) || distributionAmount <= 0) {
      return '分发金额必须大于 0'
    }

    if (distributionAmount > 999999.99) {
      return '分发金额不能超过 999999.99'
    }

    if (remark.length > 100) {
      return '备注不能超过 100 个字符'
    }

    return null
  }

  const handleDistributeClick = () => {
    const validationError = validateForm()
    if (validationError) {
      toast.error('表单验证失败', { description: validationError })
      return
    }

    setConfirmOpen(true)
  }

  const handleServiceError = (error: unknown) => {
    console.error('积分分发失败:', error)

    const errorMessage = error instanceof Error ? error.message : ''
    const errorMap: Record<string, string> = {
      '收款人不存在': '用户 ID 与用户名不匹配或用户不存在',
      '不能转账给自己': '不能向自己的账户分发积分',
      '余额不足': '可用积分不足，请减少分发金额后重试',
      '已超过每日限额': '今日分发额度已达上限，请明日再试',
      '商户信息不存在': '商户账户不可用，请检查应用凭证或联系管理员',
      '支付配置不存在': '当前账户的分发配置不可用，请联系管理员',
      '金额必须大于0': '分发金额必须大于 0',
      '金额小数位数不能超过2位': '分发金额最多保留两位小数',
      '认证': '应用凭证无效或已失效，请重新创建应用凭证',
      '无法连接': '无法连接到分发服务，请稍后重试',
      '请求超时': '分发请求超时，请稍后重试',
      '请求频率': '操作过于频繁，请稍后重试',
      '权限不足': '当前应用没有分发权限，请检查应用凭证',
      '服务器内部错误': '分发服务暂时不可用，请稍后重试',
    }
    const userMessage = Object.entries(errorMap).find(([key]) =>
      errorMessage.includes(key),
    )?.[1] || '分发失败，请检查填写内容后重试'

    toast.error('分发失败', { description: userMessage })
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      if (!apiKey?.client_id || !apiKey?.client_secret) {
        toast.error('缺少应用凭证', { description: '请先创建应用并确认凭证可用' })
        return
      }

      const response = await MerchantService.distribute({
        user_id: Number(userId.trim()),
        username: username.trim(),
        amount: distributionAmount,
        remark: remark.trim() || undefined,
      }, {
        client_id: apiKey.client_id,
        client_secret: apiKey.client_secret,
      })

      toast.success('分发成功', {
        description: `订单号: ${response.data.trade_no}`
      })

      setOpen(false)
      resetForm()
    } catch (error: unknown) {
      handleServiceError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="text-xs h-8 border-dashed w-full shadow-none">
            <Coins className="size-3 mr-1" />
            积分分发
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>积分分发</DialogTitle>
          <DialogDescription>
            向指定用户分发积分。您的积分将被扣除，对方收到的积分会扣除分发费率。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-700 dark:text-yellow-400">
            分发费率: {distributeRatePercent === null ? '加载中' : `${distributeRatePercent.toFixed(2)}%`}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-id" className="text-xs">
                用户 ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="user-id"
                placeholder="被分发者的用户 ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={loading}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs">
                用户名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                placeholder="被分发者的用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs">
              分发积分 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              max="999999.99"
              placeholder="积分数量，用户将收到扣除分发费率后的积分"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remark" className="text-xs">
              备注
            </Label>
            <Textarea
              id="remark"
              placeholder="积分分发备注，最多100字 (可选)"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              disabled={loading}
              maxLength={100}
              className="h-16 text-xs resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={loading} className="h-8 text-xs">
              取消
            </Button>
          </DialogClose>
          <Button
            onClick={(e) => { e.preventDefault(); handleDistributeClick() }}
            disabled={loading}
            className="h-8 text-xs"
          >
            {loading ? <><Spinner /> 分发中</> : '分发'}
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={confirmOpen} onOpenChange={(newOpen) => !loading && setConfirmOpen(newOpen)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认分发</AlertDialogTitle>
            <AlertDialogDescription>
              确定分发 {distributionAmount.toFixed(2)} 积分给 {username.trim()} 吗？对方预计将收到 {recipientAmount === null ? '待确认费率' : recipientAmount.toFixed(2)} 积分。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={loading}>
              {loading ? <><Spinner /> 分发中</> : '确认分发'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
