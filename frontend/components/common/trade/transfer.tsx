"use client"

import * as React from "react"
import { useState } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PasswordDialog } from "@/components/common/general/password-dialog"
import services from "@/lib/services"
import type { TransferRequest } from "@/lib/services"

/**
 * 积分转移组件
 * 
 * 提供用户之间的积分转移功能 (弹窗式)
 */
export function Transfer() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)

  /* 表单状态 */
  const [recipientUsername, setRecipientUsername] = useState("")
  const [recipientId, setRecipientId] = useState("")
  const [amount, setAmount] = useState("")
  const [remark, setRemark] = useState("")
  const [loading, setLoading] = useState(false)

  /* 验证金额格式*/
  const validateAmount = (value: string): boolean => {
    const regex = /^\d+(\.\d{1,2})?$/
    return regex.test(value) && parseFloat(value) > 0
  }

  /* 处理表单提交（第一步）*/
  const handleFormSubmit = () => {
    if (!recipientUsername.trim()) {
      toast.error("请输入接收方 LINUX DO 用户名")
      return
    }

    if (!recipientId.trim()) {
      toast.error("请输入接收方 LINUX DO ID")
      return
    }

    /* 验证ID是否为有效数字*/
    const idNum = parseInt(recipientId)
    if (isNaN(idNum) || idNum <= 0) {
      toast.error("接收方 LINUX DO ID 格式不正确")
      return
    }

    if (!amount.trim()) {
      toast.error("请输入要转移的积分数量")
      return
    }

    if (!validateAmount(amount)) {
      toast.error("积分数量格式不正确，必须大于0且最多2位小数")
      return
    }

    if (remark.length > 200) {
      toast.error("备注最多200字符")
      return
    }

    /* 关闭表单对话框，打开支付密码对话框*/
    setIsFormOpen(false)
    setIsPasswordOpen(true)
  }

  const handleConfirmTransfer = async (password: string) => {
    setLoading(true)
    try {
      const transferData: TransferRequest = {
        recipient_id: recipientId,
        recipient_username: recipientUsername,
        amount: parseFloat(amount),
        pay_key: password,
        remark: remark || undefined,
      }

      await services.transaction.transfer(transferData)

      toast.success("积分转移成功！积分已实时到账。")

      /* 重置所有状态*/
      setRecipientUsername("")
      setRecipientId("")
      setAmount("")
      setRemark("")
      setIsPasswordOpen(false)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '转移失败'
      toast.error('转移失败', {
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg px-6 py-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-4 text-foreground">开始转移</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            快速、安全地将积分转移给其他用户，支持实时到账，积分即刻可用。
          </p>
          <Button
            onClick={() => toast.error('积分转移功能已下架，请遵循积分使用规范并使用正确流转功能继续！')}
            className="bg-primary hover:bg-primary/90 font-medium px-6 rounded-md shadow-sm"
          >
            开始转移
          </Button>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>积分转移</DialogTitle>
            <DialogDescription>
              请仔细填写并核对接收方的信息和要转移的积分数量
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="recipient">接收方用户名 <span className="text-red-500">*</span></Label>
                  <Input
                    id="recipient"
                    type="text"
                    placeholder="输入用户名"
                    value={recipientUsername}
                    onChange={(e) => setRecipientUsername(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">请输入接收方 LINUX DO 用户名</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="recipientId">接收方 LINUX DO ID <span className="text-red-500">*</span></Label>
                  <Input
                    id="recipientId"
                    type="text"
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    placeholder="输入接收方 LINUX DO ID"
                    className="font-mono"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">请输入接收方的用户 LINUX DO ID</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">积分数量 <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">请输入要转移的积分数量，支持最多两位小数</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="remark">备注信息</Label>
              <Textarea
                id="remark"
                placeholder="添加备注（可选）"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                maxLength={200}
                rows={3}
                className="resize-none"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">最多 200 个字符，用于记录用途，可选</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild>
              <Button variant="ghost" disabled={loading} className="h-8 text-xs">取消</Button>
            </DialogClose>
            <Button
              onClick={(e) => {
                e.preventDefault()
                handleFormSubmit()
              }}
              disabled={!recipientId || !amount || loading}
              className="bg-primary hover:bg-primary/90 h-8 text-xs"
            >
              下一步
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PasswordDialog
        isOpen={isPasswordOpen}
        onOpenChange={(open) => {
          setIsPasswordOpen(open)
          if (!open) {
            setIsFormOpen(true)
          }
        }}
        onConfirm={handleConfirmTransfer}
        loading={loading}
        title="密码验证"
        description={`正在向 ${ recipientUsername } 转移 ${ amount } LDC`}
      />
    </div>
  )
}
