"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Gift, Copy, Check, ExternalLink, Pencil, X, Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PasswordDialog } from "@/components/common/general/password-dialog"
import { ListData } from "@/components/common/general/list-data"
import { ImageCropper } from "@/components/common/redenvelope/image-cropper"
import { motion } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@/contexts/user-context"
import services from "@/lib/services"
import type { RedEnvelopeType, CreateRedEnvelopeRequest, PublicConfigResponse, RedEnvelope, RedEnvelopeListResponse } from "@/lib/services"

interface RedEnvelopeCover {
  coverImage: string | null
  heterotypicImage: string | null
}

/**
 * 红包组件
 * 
 * 提供红包发送功能，包括 Banner 和创建对话框
 */
export function RedEnvelope({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useUser()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [isResultOpen, setIsResultOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [cropperType, setCropperType] = useState<'cover' | 'heterotypic'>('cover')
  const [showCustomization, setShowCustomization] = useState(false)

  /* 表单状态 */
  const [type, setType] = useState<RedEnvelopeType>("random")
  const [totalAmount, setTotalAmount] = useState("")
  const [totalCount, setTotalCount] = useState("")
  const [greeting, setGreeting] = useState("")
  const [loading, setLoading] = useState(false)
  
  /* 封面状态 */
  const [cover, setCover] = useState<RedEnvelopeCover>({
    coverImage: null,
    heterotypicImage: null
  })

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

    if (amount < 1) {
      toast.error("红包总金额不能低于1 LDC")
      return
    }
    
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
        cover_image: cover.coverImage || undefined,
        heterotypic_image: cover.heterotypicImage || undefined,
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
      setCover({ coverImage: null, heterotypicImage: null })
      setShowCustomization(false)

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

  /* 处理封面裁剪完成 */
  const handleCropComplete = async (croppedImage: string, coverType: 'cover' | 'heterotypic') => {
    try {
      const uploadingToast = toast.loading(`正在上传${coverType === 'cover' ? '背景封面' : '装饰图片'}...`)
      
      const result = await services.upload.uploadBase64Image(
        croppedImage,
        coverType,
        `${coverType}-${Date.now()}.png`
      )
      
      setCover(prev => ({
        ...prev,
        [coverType === 'cover' ? 'coverImage' : 'heterotypicImage']: result.url
      }))
      
      toast.dismiss(uploadingToast)
      toast.success(`${coverType === 'cover' ? '背景封面' : '装饰图片'}已设置`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败'
      toast.error(`上传${coverType === 'cover' ? '背景封面' : '装饰图片'}失败`, {
        description: errorMessage
      })
    }
  }

  /* 打开裁剪对话框 */
  const handleOpenCropper = (type: 'cover' | 'heterotypic') => {
    setCropperType(type)
    setIsCropperOpen(true)
  }

  /* 移除封面 */
  const handleRemoveCover = (type: 'cover' | 'heterotypic') => {
    setCover(prev => ({
      ...prev,
      [type === 'cover' ? 'coverImage' : 'heterotypicImage']: null
    }))
    toast.success(`${type === 'cover' ? '背景封面' : '装饰图片'}已移除`)
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
        <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-2">
                <Gift className="size-5 text-red-500" />
                发红包
              </div>
              <Button
                variant={showCustomization ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowCustomization(!showCustomization)}
                className={`flex items-center ${showCustomization ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
              >
                <Pencil className="size-4 mr-1.5" />
                <span>自定义封面</span>
              </Button>
            </DialogTitle>
            <DialogDescription>
              创建积分红包，支持固定金额和拼手气两种模式{showCustomization && "。可为红包添加个性化背景和装饰"}。
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-[1fr_auto] gap-8 pt-2">
            {/* 左侧：表单 */}
            <div className="space-y-4 md:max-w-md">
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
                    placeholder="最多 10000 人"
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

              {/* 自定义封面区域 */}
              {showCustomization && (
                <div className="grid gap-3 p-4 rounded-lg border border-dashed">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">红包封面</Label>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setShowCustomization(false)
                        setCover({ coverImage: null, heterotypicImage: null })
                      }}
                      className="text-muted-foreground"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">为红包添加个性化背景或装饰图片，让红包更有特色</p>
                  
                  <div className="space-y-2">
                    {/* 背景封面 */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">背景封面 (2:3 比例)</Label>
                      {cover.coverImage ? (
                        <div className="relative group">
                          <Image
                            src={cover.coverImage}
                            alt="背景封面"
                            width={400}
                            height={96}
                            className="w-full h-24 object-cover rounded border"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-white hover:bg-white/20"
                              onClick={() => handleOpenCropper('cover')}
                            >
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-white hover:bg-white/20"
                              onClick={() => handleRemoveCover('cover')}
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenCropper('cover')}
                          className="w-full h-24 border-dashed"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Upload className="size-4" />
                            <span className="text-xs">上传背景封面</span>
                          </div>
                        </Button>
                      )}
                    </div>

                    {/* 装饰图片 */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">装饰图片 (2:3 比例)</Label>
                      {cover.heterotypicImage ? (
                        <div className="relative group">
                          <Image
                            src={cover.heterotypicImage}
                            alt="装饰图片"
                            width={400}
                            height={96}
                            className="w-full h-24 object-cover rounded border"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-white hover:bg-white/20"
                              onClick={() => handleOpenCropper('heterotypic')}
                            >
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-white hover:bg-white/20"
                              onClick={() => handleRemoveCover('heterotypic')}
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenCropper('heterotypic')}
                          className="w-full h-24 border-dashed"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Upload className="size-4" />
                            <span className="text-xs">上传装饰图片</span>
                          </div>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
            </div>

            {/* 右侧：预览 */}
            <div className="flex items-center justify-center md:justify-end md:pr-8">
              <div className="relative w-52 h-80">
                {/* 装饰图片 - 背景装饰层，放置在信封后方 */}
                {cover.heterotypicImage && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center"
                  >
                    <Image
                      src={cover.heterotypicImage}
                      alt="装饰"
                      fill
                      className="object-cover"
                      style={{
                        transform: 'scale(1.2)',
                        transformOrigin: 'center'
                      }}
                    />
                  </motion.div>
                )}
                
                <div className="relative w-full h-full rounded-2xl shadow-xl overflow-hidden z-10">
                  {/* 预览背景 */}
                  {cover.coverImage ? (
                    <div className="absolute inset-0">
                      <Image
                        src={cover.coverImage}
                        alt="预览"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-700">
                      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-yellow-400/30 via-yellow-500/20 to-transparent" />
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-8 left-8 w-16 h-16 border-2 border-yellow-300 rounded-full" />
                        <div className="absolute top-16 right-10 w-12 h-12 border-2 border-yellow-300 rounded-full" />
                        <div className="absolute bottom-16 left-12 w-20 h-20 border-2 border-yellow-300 rounded-full" />
                      </div>
                    </div>
                  )}

                  {/* 预览内容 */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                  >
                    <Avatar className="h-10 w-10 mb-2 border-2 border-yellow-400/80 shadow-lg">
                      <AvatarImage src={user?.avatar_url} alt={user?.username} />
                      <AvatarFallback className="bg-gradient-to-br from-yellow-300 to-yellow-500 text-red-600 font-bold text-sm">
                        {user?.username?.charAt(0).toUpperCase() || '你'}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <p className="text-yellow-100 text-xs font-medium mb-6">{user?.username || '你'} 的红包</p>

                  <motion.div
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 flex items-center justify-center shadow-2xl border-4 border-yellow-200/50"
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="text-red-600 font-bold text-xl" style={{ fontFamily: 'serif' }}>
                      開
                    </span>
                  </motion.div>

                  <p className="text-yellow-100 text-xs mt-6 px-4 text-center leading-relaxed">
                    {greeting || "恭喜发财，大吉大利"}
                  </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

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

      <ImageCropper
        isOpen={isCropperOpen}
        onOpenChange={setIsCropperOpen}
        onCropComplete={handleCropComplete}
        coverType={cropperType}
      />
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
