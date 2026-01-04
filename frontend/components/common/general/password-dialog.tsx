"use client"

import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface PasswordDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (password: string) => void
  loading?: boolean
  title?: string
  description?: string
}

/**
 * 密码输入对话框
 * 
 * 用于敏感操作前的二次确认
 */
export function PasswordDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  loading = false,
  title = "请输入密码",
  description = "为了您的账户安全，请输入6位认证密码进行验证"
}: PasswordDialogProps) {
  const [password, setPassword] = useState("")

  const handleConfirm = () => {
    if (password.length === 6) {
      onConfirm(password)
    }
  }

  /* 当对话框关闭时重置密码*/
  React.useEffect(() => {
    if (!isOpen) {
      setPassword("")
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6">

          <InputOTP
            maxLength={6}
            value={password}
            onChange={setPassword}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && password.length === 6 && !loading) {
                handleConfirm()
              }
            }}
          >
            <InputOTPGroup className="gap-2">
              <InputOTPSlot index={0} className="w-10 h-10 text-base" />
              <InputOTPSlot index={1} className="w-10 h-10 text-base" />
              <InputOTPSlot index={2} className="w-10 h-10 text-base" />
              <InputOTPSlot index={3} className="w-10 h-10 text-base" />
              <InputOTPSlot index={4} className="w-10 h-10 text-base" />
              <InputOTPSlot index={5} className="w-10 h-10 text-base" />
            </InputOTPGroup>
          </InputOTP>

          <Button
            type="button"
            className="w-full bg-primary hover:bg-primary/90 h-8 text-xs"
            onClick={handleConfirm}
            disabled={password.length !== 6 || loading}
          >
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                验证中...
              </>
            ) : (
              "确认"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
