
"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Gift, Copy, Check, ExternalLink, Users, Coins } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PasswordDialog } from "@/components/common/general/password-dialog"
import services from "@/lib/services"
import type { RedEnvelopeType, CreateRedEnvelopeRequest, RedEnvelope, RedEnvelopeListResponse, PublicConfigResponse } from "@/lib/services"
import { formatDateTime } from "@/lib/utils"

/**
 * 红包组件
 * 
 * 提供红包发送功能和红包列表查看
 */
export function RedEnvelope() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [isResultOpen, setIsResultOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent')

  /* 表单状态 */
  const [type, setType] = useState<RedEnvelopeType>("random")
  const [totalAmount, setTotalAmount] = useState("")
  const [totalCount, setTotalCount] = useState("")
  const [greeting, setGreeting] = useState("")
  const [loading, setLoading] = useState(false)

  /* 结果状态 */
  const [resultLink, setResultLink] = useState("")

  /* 列表状态 */
  const [sentEnvelopes, setSentEnvelopes] = useState<RedEnvelope[]>([])
  const [receivedEnvelopes, setReceivedEnvelopes] = useState<RedEnvelope[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [sentPage, setSentPage] = useState(1)
  const [receivedPage, setReceivedPage] = useState(1)
  const [sentTotal, setSentTotal] = useState(0)
  const [receivedTotal, setReceivedTotal] = useState(0)

  /* 配置状态 */
  const [config, setConfig] = useState<PublicConfigResponse | null>(null)

  /* 加载红包列表 */
  const loadEnvelopes = async (listType: 'sent' | 'received', page: number) => {
    setListLoading(true)
    try {
      const result: RedEnvelopeListResponse = await services.redEnvelope.getList({
        page,
        page_size: 10,
        type: listType,
      })
      
      if (listType === 'sent') {
        setSentEnvelopes(prev => page === 1 ? result.red_envelopes : [...prev, ...result.red_envelopes])
        setSentTotal(result.total)
      } else {
        setReceivedEnvelopes(prev => page === 1 ? result.red_envelopes : [...prev, ...result.red_envelopes])
        setReceivedTotal(result.total)
      }
    } catch {
      toast.error('加载红包列表失败')
    } finally {
      setListLoading(false)
    }
  }

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
    loadEnvelopes('sent', 1)
    loadEnvelopes('received', 1)
  }, [])

  /* 标签切换时加载数据 */
  useEffect(() => {
    if (activeTab === 'sent' && sentEnvelopes.length === 0) {
      loadEnvelopes('sent', 1)
    } else if (activeTab === 'received' && receivedEnvelopes.length === 0) {
      loadEnvelopes('received', 1)
    }
  }, [activeTab, sentEnvelopes.length, receivedEnvelopes.length])

  /* 验证金额格式 */
  const validateAmount = (value: string): boolean => {
    const regex = /^\d+(\.\d{1,2})?$/
    return regex.test(value) && parseFloat(value) > 0
  }

  /* 处理表单提交（第一步） */
  const handleFormSubmit = () => {
    if (!totalAmount.trim()) {
      toast.error("请输入红包总金额")
      return
    }

    if (!validateAmount(totalAmount)) {
      toast.error("金额格式不正确，必须大于0且最多2位小数")
      return
    }

    if (!totalCount.trim()) {
      toast.error("请输入红包个数")
      return
    }

    const count = parseInt(totalCount)
    if (isNaN(count) || count <= 0) {
      toast.error("红包个数必须大于0")
      return
    }

    const amount = parseFloat(totalAmount)
    
    // 检查红包最大金额限制
    if (config && parseFloat(config.red_envelope_max_amount) > 0) {
      if (amount > parseFloat(config.red_envelope_max_amount)) {
        toast.error(`红包金额不能超过 ${config.red_envelope_max_amount} LDC`)
        return
      }
    }
    
    if (type === "fixed" && amount / count < 0.01) {
      toast.error("每个红包金额不能小于0.01")
      return
    }

    if (greeting.length > 100) {
      toast.error("祝福语最多100字符")
      return
    }

    setIsFormOpen(false)
    setIsPasswordOpen(true)
  }

  /* 处理最终创建（第二步） */
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
      
      // 前端生成链接
      const link = getEnvelopeLink(result.id)
      setResultLink(link)
      setIsPasswordOpen(false)
      setIsResultOpen(true)

      /* 重置表单 */
      setType("random")
      setTotalAmount("")
      setTotalCount("")
      setGreeting("")

      /* 刷新发送列表 */
      loadEnvelopes('sent', 1)
      setSentPage(1)
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

  /* 计算每个红包金额 */
  const perAmount = React.useMemo(() => {
    if (!totalAmount || !totalCount) return null
    const amount = parseFloat(totalAmount)
    const count = parseInt(totalCount)
    if (isNaN(amount) || isNaN(count) || count <= 0) return null
    if (type === "fixed") {
      return (amount / count).toFixed(2)
    }
    return null
  }, [totalAmount, totalCount, type])

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

  /* 获取状态标签 */
  const getStatusBadge = (status: string) => {
    const config = {
      active: { label: '进行中', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
      finished: { label: '已领完', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' },
      expired: { label: '已过期', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
    }[status] || { label: status, color: '' }

    return (
      <Badge variant="outline" className={`${config.color} text-xs`}>
        {config.label}
      </Badge>
    )
  }

  /* 生成红包链接 */
  const getEnvelopeLink = (id: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/redenvelope/${id}`
    }
    return `/redenvelope/${id}`
  }

  /* 渲染红包卡片 */
  const renderEnvelopeCard = (envelope: RedEnvelope, isSent: boolean) => {
    const link = getEnvelopeLink(envelope.id)
    const claimedCount = envelope.total_count - envelope.remaining_count
    const claimedAmount = (parseFloat(envelope.total_amount) - parseFloat(envelope.remaining_amount)).toFixed(2)

    return (
      <Card key={envelope.id} className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-medium text-sm mb-1">
                  {isSent ? '发给朋友' : `来自 ${envelope.creator_username}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {envelope.greeting || "恭喜发财，大吉大利"}
                </div>
              </div>
            </div>
            {getStatusBadge(envelope.status)}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-muted/50 rounded-lg">
            <div>
              <div className="text-xs text-muted-foreground mb-1">总金额</div>
              <div className="font-semibold text-sm flex items-center gap-1">
                <Coins className="h-3 w-3 text-yellow-600" />
                {envelope.total_amount} LDC
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">已领取</div>
              <div className="font-semibold text-sm flex items-center gap-1">
                <Users className="h-3 w-3 text-green-600" />
                {claimedCount}/{envelope.total_count} 个
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">剩余金额</div>
              <div className="font-semibold text-sm text-red-600">
                {envelope.remaining_amount} LDC
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">已领金额</div>
              <div className="font-semibold text-sm text-green-600">
                {claimedAmount} LDC
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span>类型: {envelope.type === 'random' ? '拼手气' : '固定金额'}</span>
            <span>•</span>
            <span>{formatDateTime(envelope.created_at)}</span>
          </div>

          {isSent && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => handleCopyLink(link, envelope.id)}
              >
                {copiedId === envelope.id ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                {copiedId === envelope.id ? '已复制' : '复制链接'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3"
                onClick={() => window.open(link, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )}

          {!isSent && envelope.status === 'active' && (
            <Button
              size="sm"
              className="w-full h-8 text-xs bg-red-500 hover:bg-red-600"
              onClick={() => window.open(link, '_blank')}
            >
              查看红包
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-lg px-6 py-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold mb-4 text-foreground flex items-center gap-2">
            <Gift className="h-8 w-8 text-red-500" />
            发红包
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            创建红包分享给好友，支持固定金额和拼手气两种模式。
          </p>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-red-500 hover:bg-red-600 font-medium px-6 rounded-md shadow-sm"
          >
            发红包
          </Button>
        </div>
      </div>

      {/* 红包列表 */}
      <div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sent' | 'received')}>
          <TabsList className="mb-4">
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              我发出的 ({sentTotal})
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              我收到的 ({receivedTotal})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sent" className="space-y-4">
            {listLoading && sentEnvelopes.length === 0 ? (
              <div className="flex justify-center py-12">
                <Spinner className="h-8 w-8" />
              </div>
            ) : sentEnvelopes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>还没有发送红包记录</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sentEnvelopes.map(envelope => renderEnvelopeCard(envelope, true))}
                </div>
                {sentEnvelopes.length < sentTotal && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const nextPage = sentPage + 1
                      setSentPage(nextPage)
                      loadEnvelopes('sent', nextPage)
                    }}
                    disabled={listLoading}
                    className="w-full"
                  >
                    {listLoading ? <Spinner className="h-4 w-4 mr-2" /> : null}
                    加载更多 ({sentEnvelopes.length}/{sentTotal})
                  </Button>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            {listLoading && receivedEnvelopes.length === 0 ? (
              <div className="flex justify-center py-12">
                <Spinner className="h-8 w-8" />
              </div>
            ) : receivedEnvelopes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Coins className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>还没有收到红包记录</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {receivedEnvelopes.map(envelope => renderEnvelopeCard(envelope, false))}
                </div>
                {receivedEnvelopes.length < receivedTotal && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const nextPage = receivedPage + 1
                      setReceivedPage(nextPage)
                      loadEnvelopes('received', nextPage)
                    }}
                    disabled={listLoading}
                    className="w-full"
                  >
                    {listLoading ? <Spinner className="h-4 w-4 mr-2" /> : null}
                    加载更多 ({receivedEnvelopes.length}/{receivedTotal})
                  </Button>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* 创建红包表单 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-red-500" />
              发红包
            </DialogTitle>
            <DialogDescription>
              创建红包并分享链接给好友领取
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>红包类型 <span className="text-red-500">*</span></Label>
              <Select value={type} onValueChange={(v) => setType(v as RedEnvelopeType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">拼手气红包</SelectItem>
                  <SelectItem value="fixed">固定金额红包</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {type === "random" ? "每人领取金额随机" : "每人领取相同金额"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="totalAmount">总金额 <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">LDC</span>
                  <Input
                    id="totalAmount"
                    type="text"
                    placeholder="0.00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="pl-12 font-mono"
                    disabled={loading}
                  />
                </div>
                {config && parseFloat(config.red_envelope_max_amount) > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    最大 {config.red_envelope_max_amount} LDC
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground invisible">6565</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="totalCount">红包个数 <span className="text-red-500">*</span></Label>
                <Input
                  id="totalCount"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={totalCount}
                  onChange={(e) => setTotalCount(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground invisible">占位</p>
              </div>
            </div>

            {type === "fixed" && perAmount && (
              <p className="text-sm text-muted-foreground">
                每个红包 {perAmount} LDC
              </p>
            )}

            {feeInfo && parseFloat(feeInfo.fee) > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>红包金额</span>
                    <span className="font-mono">{totalAmount} LDC</span>
                  </div>
                  <div className="flex justify-between text-amber-600 dark:text-amber-500">
                    <span>手续费 ({(feeInfo.rate * 100).toFixed(1)}%)</span>
                    <span className="font-mono">+{feeInfo.fee} LDC</span>
                  </div>
                  <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-amber-200 dark:border-amber-800">
                    <span>总计支付</span>
                    <span className="font-mono">{feeInfo.total} LDC</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="greeting">祝福语</Label>
              <Textarea
                id="greeting"
                placeholder="恭喜发财，大吉大利"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                maxLength={100}
                rows={2}
                className="resize-none"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">最多100字符</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setIsFormOpen(false)} disabled={loading} className="h-8 text-xs">
              取消
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={!totalAmount || !totalCount || loading}
              className="bg-red-500 hover:bg-red-600 h-8 text-xs"
            >
              下一步
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 密码验证 */}
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
            ? `正在创建 ${totalAmount} LDC 的红包（${totalCount}个），手续费 ${feeInfo.fee} LDC，总计支付 ${feeInfo.total} LDC`
            : `正在创建 ${totalAmount} LDC 的红包（${totalCount}个）`
        }
      />

      {/* 创建成功结果 */}
      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              红包创建成功
            </DialogTitle>
            <DialogDescription>
              复制链接分享给好友领取红包
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex gap-2">
              <Input
                value={resultLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopyLink(resultLink, "result")}
              >
                {copiedId === "result" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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