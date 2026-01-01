"use client"

import * as React from "react"
import { useState } from "react"
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
import { MerchantService } from "@/lib/services"

interface DistributeDialogProps {
  /** 自定义触发器 */
  trigger?: React.ReactNode
}

/**
 * 商户分发对话框
 * 商户向用户分发积分
 */
export function DistributeDialog({ trigger }: DistributeDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [userId, setUserId] = useState("")
  const [username, setUsername] = useState("")
  const [amount, setAmount] = useState("")
  const [remark, setRemark] = useState("")

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
    setOpen(newOpen)
  }

  const handleSubmit = async () => {
    if (!userId.trim()) {
      toast.error('表单验证失败', { description: '请填写用户 ID' })
      return
    }

    if (!username.trim()) {
      toast.error('表单验证失败', { description: '请填写用户名' })
      return
    }

    if (!amount.trim()) {
      toast.error('表单验证失败', { description: '请填写分发金额' })
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('表单验证失败', { description: '分发金额必须大于 0' })
      return
    }

    if (amountNum > 999999.99) {
      toast.error('表单验证失败', { description: '分发金额不能超过 999999.99' })
      return
    }

    if (remark.length > 100) {
      toast.error('表单验证失败', { description: '备注不能超过 100 个字符' })
      return
    }

    try {
      setLoading(true)

      const result = await MerchantService.distribute({
        user_id: userId.trim(),
        username: username.trim(),
        amount: amountNum,
        remark: remark.trim() || undefined,
      })

      toast.success('分发成功', {
        description: `订单号: ${ result.trade_no }`
      })

      setOpen(false)
      resetForm()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '分发失败'
      toast.error('分发失败', { description: errorMessage })
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
            onClick={(e) => { e.preventDefault(); handleSubmit() }}
            disabled={loading}
            className="h-8 text-xs"
          >
            {loading ? <><Spinner /> 分发中</> : '分发'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
