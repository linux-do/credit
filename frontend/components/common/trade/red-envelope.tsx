"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Gift, Copy, Check, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PasswordDialog } from "@/components/common/general/password-dialog"
import { ListData } from "@/components/common/general/list-data"
import services from "@/lib/services"
import type { RedEnvelopeType, CreateRedEnvelopeRequest, PublicConfigResponse, RedEnvelope, RedEnvelopeListResponse } from "@/lib/services"

/**
 * 红包组件
 * 
 * 提供红包发送功能，包括 Banner 和创建对话框
 */
export function RedEnvelope({ onSuccess }: { onSuccess?: () => void }) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [isResultOpen, setIsResultOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  /* 表单状态 */
  const [type, setType] = useState<RedEnvelopeType>("random")
  const [totalAmount, setTotalAmount] = useState("")
  const [totalCount, setTotalCount] = useState("")
  const [greeting, setGreeting] = useState("")
  const [loading, setLoading] = useState(false)

  /* 结果状态 */
  const [resultLink, setResultLink] = useState("")

  /* 配置状态 */
  const [config, setConfig] = useState<PublicConfigResponse | null>(null)

  /* 加载配置 */
  const loadConfig = async () => {
    try {
      const result = await services.config.getPublicConfig()
      setConfig(result)
    } catch {
      toast.error('加载配置失败')
    }
  }

  /* 初始加载 */
  useEffect(() => {
    loadConfig()
  }, [])

  /* 验证积分格式 */
  const validateAmount = (value: string): boolean => {
    const regex = /^\d+(\.\d{1,2})?$/
    return regex.test(value) && parseFloat(value) > 0
  }

  /* 处理表单提交 */
  const handleFormSubmit = () => {
    if (!totalAmount.trim()) {
      toast.error("请设置积分总数")
      return
    }

    if (!validateAmount(totalAmount)) {
      toast.error("积分格式不正确，必须大于1且最多2位小数")
      return
    }

    if (!totalCount.trim()) {
      toast.error("请设置可领取人数")
      return
    }

    const count = parseInt(totalCount)
    if (isNaN(count) || count <= 0) {
      toast.error("可领取人数必须大于0")
      return
    }

    const amount = parseFloat(totalAmount)

    // 检查红包最低金额限制（1 LDC）
    if (amount < 1) {
      toast.error("红包总金额不能低于1 LDC")
      return
    }
    
    // 检查红包最大金额限制
    if (config && parseFloat(config.red_envelope_max_amount) > 0) {
      if (amount > parseFloat(config.red_envelope_max_amount)) {
        toast.error(`红包的积分总数不能超过 ${ config.red_envelope_max_amount } LDC`)
        return
      }
    }

    if (count > 10000) {
      toast.error("可领取人数不能超过 10000 个")
      return
    }

    if (amount < 1) {
      toast.error("红包的积分总数不能小于 1 LDC")
      return
    }

    if (amount / count < 0.01) {
      toast.error("单个红包不可低于 0.01 LDC")
      return
    }

    if (greeting.length > 100) {
      toast.error("祝福语最多100字符")
      return
    }

    setIsPasswordOpen(true)
  }

  /* 提交创建 */
  const handleConfirmCreate = async (password: string) => {
    setLoading(true)
    try {
      const data: CreateRedEnvelopeRequest = {
        type,
        total_amount: parseFloat(totalAmount),
        total_count: parseInt(totalCount),
        greeting: greeting || "恭喜发财，大吉大利",
        pay_key: password,
      }

      const result = await services.redEnvelope.create(data)

      const link = getEnvelopeLink(result.id)
      setResultLink(link)
      setIsPasswordOpen(false)
      setIsFormOpen(false)
      setIsResultOpen(true)
      onSuccess?.()

      /* 重置表单 */
      setType("random")
      setTotalAmount("")
      setTotalCount("")
      setGreeting("")

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '创建失败'
      toast.error('创建红包失败', { description: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  /* 复制链接 */
  const handleCopyLink = async (link: string, envelopeId: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(envelopeId)
      toast.success("链接已复制")
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error("复制失败")
    }
  }

  /* 计算手续费 */
  const feeInfo = React.useMemo(() => {
    if (!totalAmount || !config) return null
    const amount = parseFloat(totalAmount)
    if (isNaN(amount)) return null

    const feeRate = parseFloat(config.red_envelope_fee_rate)
    const fee = (amount * feeRate).toFixed(2)
    const total = (amount + parseFloat(fee)).toFixed(2)

    return { fee, total, rate: feeRate }
  }, [totalAmount, config])

  /* 生成红包链接 */
  const getEnvelopeLink = (id: string) => {
    if (typeof window !== 'undefined') {
      return `${ window.location.origin }/redenvelope/${ id }`
    }
    return `/redenvelope/${ id }`
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-lg px-6 py-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-4 text-foreground">
            发红包
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            创建积分红包，支持固定金额和拼手气两种模式。
          </p>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-red-500 hover:bg-red-600 font-medium px-6 rounded-md shadow-sm"
          >
            发红包
          </Button>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="size-5 text-red-500" />
              发红包
            </DialogTitle>
            <DialogDescription>
              创建积分红包，支持固定金额和拼手气两种模式。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 pt-2">
            <div className="grid gap-2">
              <Label>红包类型 <span className="text-red-500">*</span></Label>
              <Select value={type} onValueChange={(v) => setType(v as RedEnvelopeType)}>
                <SelectTrigger className="text-xs w-full shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random" className="text-xs">拼手气红包</SelectItem>
                  <SelectItem value="fixed" className="text-xs">普通红包</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="totalAmount">积分总数 <span className="text-red-500">*</span></Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={config && parseFloat(config.red_envelope_max_amount) > 0 ? config.red_envelope_max_amount : undefined}
                  placeholder={config && parseFloat(config.red_envelope_max_amount) > 0 ? `最大 ${ config.red_envelope_max_amount } LDC` : "0.00"}
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="font-mono shadow-none"
                  disabled={loading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="totalCount">可领取人数 <span className="text-red-500">*</span></Label>
                <Input
                  id="totalCount"
                  type="number"
                  placeholder="最多 10000 人领取"
                  value={totalCount}
                  onChange={(e) => setTotalCount(e.target.value)}
                  className="font-mono shadow-none"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="greeting">祝福语</Label>
              <Textarea
                id="greeting"
                placeholder="恭喜发财，大吉大利"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                maxLength={100}
                rows={2}
                className="resize-none shadow-none"
                disabled={loading}
              />
            </div>
          </div>

          {feeInfo && parseFloat(feeInfo.fee) > 0 && (
            <div className="text-xs space-y-1 p-2 rounded-md border border-dashed">
              <div className="flex justify-between">
                <span className="text-muted-foreground">积分</span>
                <span className="font-mono text-muted-foreground">{totalAmount} LDC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  费率 ({(feeInfo.rate * 100).toFixed(2)}%)
                </span>
                <span className="font-mono text-muted-foreground">+{feeInfo.fee} LDC</span>
              </div>

              <div className="border-t border-dashed my-1 opacity-50" />

              <div className="flex justify-between items-center">
                <span className="text-foreground font-medium">总计</span>
                <span className="font-mono font-medium">{feeInfo.total} LDC</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setIsFormOpen(false)} disabled={loading} className="h-8 text-xs">
              取消
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={!totalAmount || !totalCount || loading || !!(config && config.red_envelope_max_recipients > 0 && parseInt(totalCount) > config.red_envelope_max_recipients)}
              className="bg-red-500 hover:bg-red-600 h-8 text-xs"
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
          if (!open) setIsFormOpen(true)
        }}
        onConfirm={handleConfirmCreate}
        loading={loading}
        title="密码验证"
        description={
          feeInfo && parseFloat(feeInfo.fee) > 0
            ? `正在创建 ${ totalAmount } LDC 的积分红包，可领取人数 ${ totalCount } 个，服务费率 ${ feeInfo.fee } LDC，总计需要 ${ feeInfo.total } LDC`
            : `正在创建 ${ totalAmount } LDC 的积分红包，可领取人数 ${ totalCount } 个`
        }
      />

      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent className="w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              创建成功
            </DialogTitle>
            <DialogDescription>
              复制此链接分享给好友领取红包
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="flex gap-2">
              <Input
                value={resultLink}
                readOnly
                className="text-xs font-mono shadow-none border-none bg-muted"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCopyLink(resultLink, "result")}
              >
                {copiedId === "result" ? <Check className="size-3" /> : <Copy className="size-3" />}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(resultLink, "_blank")}
              >
                <ExternalLink className="size-3" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setIsResultOpen(false)} className="h-8 text-xs">
              完成
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * 红包列表组件
 * 
 * 使用通用 ListData 组件展示红包记录
 */
export function RedEnvelopeList({ refreshTrigger }: { refreshTrigger?: number }) {
  const fetchEnvelopes = async (params: { page: number, page_size: number, type: string }) => {
    const result: RedEnvelopeListResponse = await services.redEnvelope.getList({
      page: params.page,
      page_size: params.page_size,
      type: params.type as 'sent' | 'received',
    })
    return { list: result.red_envelopes, total: result.total }
  }

  return (
    <ListData
      fetchData={fetchEnvelopes}
      tabs={[
        { value: 'sent', label: '我发出的', color: 'bg-primary/10 text-primary' },
        { value: 'received', label: '我收到的', color: 'bg-primary/10 text-primary' }
      ]}
      defaultTab="received"
      refreshTrigger={refreshTrigger}
    />
  )
}