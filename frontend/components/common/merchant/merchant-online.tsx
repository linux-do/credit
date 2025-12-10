"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { ArrowLeft, Copy, Check, ExternalLink, Package, Link2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useMerchant } from "@/contexts/merchant-context"
import { MerchantService, type PaymentLink } from "@/lib/services"

export function MerchantOnline() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { apiKeys, loading: loadingKeys } = useMerchant()

  const apiKeyId = searchParams.get("apiKeyId")
  const [selectedKey, setSelectedKey] = useState(
    apiKeys.find(k => k.id.toString() === apiKeyId) || null
  )

  const [isLoading, setIsLoading] = useState(false)
  const [createdLink, setCreatedLink] = useState<PaymentLink | null>(null)
  const [hasCopied, setHasCopied] = useState(false)

  const [productName, setProductName] = useState("")
  const [amount, setAmount] = useState("")
  const [remark, setRemark] = useState("")

  useEffect(() => {
    if (apiKeys.length > 0 && apiKeyId) {
      const key = apiKeys.find(k => k.id.toString() === apiKeyId)
      if (key) setSelectedKey(key)
    }
  }, [apiKeys, apiKeyId])

  const handleBack = () => {
    router.back()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedKey) return
    if (!productName || !amount) {
      toast.error("请填写完整信息")
      return
    }

    setIsLoading(true)
    try {
      const link = await MerchantService.createPaymentLink(selectedKey.id, {
        product_name: productName,
        amount: Number(amount),
        remark: remark
      })
      setCreatedLink(link)
      toast.success("支付链接创建成功")
    } catch (error) {
      toast.error("创建失败", {
        description: (error as Error).message
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (!createdLink) return

    const url = `${ window.location.origin }/pay/${ createdLink.token }`
    navigator.clipboard.writeText(url)
    setHasCopied(true)
    toast.success("链接已复制")
    setTimeout(() => setHasCopied(false), 2000)
  }

  const handleReset = () => {
    setCreatedLink(null)
    setProductName("")
    setAmount("")
    setRemark("")
  }

  if (loadingKeys && !selectedKey) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (!selectedKey && !loadingKeys && apiKeys.length > 0) {
    // If no key selected but keys exist, maybe redirect or show selector?
    // unlikely if navigated from merchant-data
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">未找到商户信息</p>
        <Button onClick={handleBack}>返回</Button>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="mb-8">
        <Button variant="ghost" className="pl-0 hover:pl-2 transition-all mb-4 text-muted-foreground" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回商户中心
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">创建支付链接</h1>
        <p className="text-muted-foreground mt-2">
          创建一个固定金额的支付页面，分享链接即可收款。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left: Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="order-2 lg:order-1"
        >
          <div className="sticky top-8">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">预览</span>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500/20" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                <div className="w-2 h-2 rounded-full bg-green-500/20" />
              </div>
            </div>

            <Card className="overflow-hidden border-0 shadow-2xl bg-white dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-white/10">
              <div className="p-8 md:p-12 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-muted/50 rounded-2xl flex items-center justify-center mb-2">
                  <Package className="w-10 h-10 text-muted-foreground/40" />
                </div>

                <div className="space-y-2 w-full">
                  <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    {selectedKey?.app_name || "商户名称"}
                  </div>
                  <h3 className="text-2xl font-bold break-words">
                    {productName || "商品名称"}
                  </h3>
                  {remark && (
                    <p className="text-sm text-muted-foreground break-words max-w-[80%] mx-auto">
                      {remark}
                    </p>
                  )}
                </div>

                <div className="py-8 w-full border-y border-dashed border-border/50">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold tracking-tight">
                      {amount ? `¥ ${ Number(amount).toFixed(2) }` : "¥ 0.00"}
                    </span>
                  </div>
                </div>

                <Button className="w-full h-10 font-medium rounded-xl pointer-events-none opacity-90" size="lg">
                  立即支付
                </Button>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-2 h-2 text-white" />
                  </div>
                  <span>安全支付 · SSL 加密</span>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="order-1 lg:order-2"
        >
          <Card className="border-0 shadow-none bg-transparent">
            <AnimatePresence mode="wait">
              {createdLink ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  <div className="rounded-xl border bg-card p-6 flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 mb-2">
                      <Check className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">支付链接已生成</h3>
                      <p className="text-sm text-muted-foreground">
                        您可以直接复制下方链接发送给客户，或嵌入到您的网站中。
                      </p>
                    </div>

                    <div className="w-full flex items-center gap-2 p-2 bg-muted/50 rounded-lg border mt-4">
                      <div className="h-8 w-8 flex items-center justify-center bg-background rounded border text-muted-foreground shrink-0">
                        <Link2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 truncate text-sm font-medium font-mono text-left px-2">
                        {`${ typeof window !== 'undefined' ? window.location.origin : '' }/pay/${ createdLink.token }`}
                      </div>
                      <Button size="icon" variant="ghost" onClick={handleCopy}>
                        {hasCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-10" asChild>
                      <a href={`/pay/${ createdLink.token }`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        访问链接
                      </a>
                    </Button>
                    <Button className="h-10" onClick={handleReset}>
                      创建新链接
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                  onSubmit={handleSubmit}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">商品名称</Label>
                      <Input
                        id="name"
                        placeholder="例如：高级会员订阅 (月付)"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="h-10"
                        maxLength={30}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">金额</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-10 font-mono"
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="remark">备注 (可选)</Label>
                      <Textarea
                        id="remark"
                        placeholder="添加关于此商品的详细说明..."
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        className="min-h-[100px] resize-none"
                        maxLength={100}
                      />
                      <div className="text-xs text-right text-muted-foreground">
                        {remark.length}/100
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 font-medium shadow-lg shadow-primary/20"
                    disabled={isLoading || !productName || !amount}
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2" />
                        正在创建...
                      </>
                    ) : (
                      "创建支付链接"
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
