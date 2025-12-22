"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { Key, Smartphone, Tablet, Monitor, RotateCw, Plus, Trash2, Copy, ExternalLink, CreditCard, ArrowLeft, Loader2, Eye, EyeOff, Expand, Minimize, Sun, Moon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useMerchant } from "@/contexts/merchant-context"
import { TransactionProvider, useTransaction } from "@/contexts/transaction-context"
import { MerchantService, type PaymentLink, type GetMerchantOrderResponse, type MerchantAPIKey } from "@/lib/services"
import { PayingInfo } from "@/components/common/pay/paying/paying-info"
import { PayingNow } from "@/components/common/pay/paying/paying-now"
import { MerchantSelector } from "@/components/common/merchant/merchant-selector"
import { LoadingPage } from "@/components/layout/loading"
import { TransactionTableList } from "@/components/common/general/table-data"

export function MerchantOnline() {
  const searchParams = useSearchParams()
  const { apiKeys, loading: loadingKeys, loadAPIKeys } = useMerchant()
  const apiKeyId = searchParams.get("apiKeyId")
  const selectedKey = apiKeys.find(k => k.id.toString() === apiKeyId) || null

  if (loadingKeys) {
    return <LoadingPage text="在线流转" badgeText="积分" />
  }

  if (apiKeys.length === 0) {
    return (
      <div className="flex flex-col gap-6 py-6 box-border h-[calc(100vh-60px)]">
        <div className="flex items-center justify-between border-b border-border pb-2 shrink-0">
          <h1 className="text-2xl font-semibold">在线流转</h1>
        </div>
        <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg flex-1">
          <div className="rounded-lg p-3 bg-muted/50 mb-4">
            <Key className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-1">暂未创建应用</h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
            您还没有创建任何应用。请前往集市中心创建应用，即可开始使用在线积分流转服务。
          </p>
          <Button onClick={() => window.location.href = '/merchant'} variant="default" size="sm">
            前往集市中心
          </Button>
        </div>
      </div>
    )
  }

  return (
    <TransactionProvider
      defaultParams={{
        page_size: 20,
        type: 'online',
        client_id: selectedKey?.client_id
      }}
    >
      <MerchantOnlineContent apiKeys={apiKeys} loadAPIKeys={loadAPIKeys} />
    </TransactionProvider>
  )
}

interface MerchantOnlineContentProps {
  apiKeys: MerchantAPIKey[]
  loadAPIKeys: () => Promise<void>
}

function MerchantOnlineContent({ apiKeys, loadAPIKeys }: MerchantOnlineContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    transactions,
    loading: loadingTransactions,
    error: transactionsError,
    total,
    currentPage,
    totalPages,
    fetchTransactions,
    loadMore,
    refresh
  } = useTransaction()

  /* 加载 API Keys */
  useEffect(() => {
    loadAPIKeys()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* 派生 selectedKey */
  const apiKeyId = searchParams.get("apiKeyId")

  /* 处理集市应用切换 */
  const handleMerchantSelect = useCallback((id: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("apiKeyId", id.toString())
    router.push(`${ window.location.pathname }?${ params.toString() }`)
  }, [searchParams, router])

  /* 自动选择第一个集市应用 */
  useEffect(() => {
    if (apiKeys.length > 0 && !apiKeyId) {
      handleMerchantSelect(apiKeys[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKeys.length, apiKeyId])

  const selectedKey = apiKeys.find(k => k.id.toString() === apiKeyId) || null

  /* 集市状态 */
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([])
  const [selectedLink, setSelectedLink] = useState<PaymentLink | null>(null)
  const [previewLink, setPreviewLink] = useState<PaymentLink | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)

  /* 创建表单状态 */
  const [productName, setProductName] = useState("")
  const [amount, setAmount] = useState("")
  const [remark, setRemark] = useState("")

  /* 设备预览状态 */
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile')
  const [showToken, setShowToken] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light')

  /* 获取应用列表 */
  const fetchLinks = useCallback(async () => {
    if (!selectedKey) {
      setPaymentLinks([])
      return
    }
    try {
      setLoading(true)
      const links = await MerchantService.listPaymentLinks(selectedKey.id)
      setPaymentLinks(links)
      /* 自动设置第一个应用为预览 */
      if (links.length > 0) {
        setPreviewLink(prev => prev || links[0])
      }
    } catch (error) {
      console.error(error)
      toast.error("获取应用列表失败")
    } finally {
      setLoading(false)
    }
  }, [selectedKey])

  /* 当 selectedKey 变化时,重新获取应用列表和数据 */
  useEffect(() => {
    if (selectedKey?.client_id) {
      fetchLinks()
      fetchTransactions({
        page: 1,
        page_size: 20,
        type: 'online',
        client_id: selectedKey.client_id
      })
      setIsCreating(false)
      setSelectedLink(null)
    } else {
      setPaymentLinks([])
      setIsCreating(false)
      setSelectedLink(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey?.client_id])


  /* 处理返回 */
  const handleBack = () => {
    router.back()
  }

  /* 处理创建 */
  const handleCreate = async () => {
    if (!selectedKey) return
    if (!productName || !amount) {
      toast.error("请填写在线积分流转服务的名称和数量")
      return
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("积分数量必须设置为大于0的数值")
      return
    }

    try {
      setLoading(true)
      const newLink = await MerchantService.createPaymentLink(selectedKey.id, {
        product_name: productName,
        amount: parseFloat(amount),
        remark
      })
      toast.success("在线积分流转服务创建成功")
      /* 重置表单 */
      setProductName("")
      setAmount("")
      setRemark("")

      /* 更新UI */
      fetchLinks()
      setIsCreating(false)
      setSelectedLink(newLink)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "在线积分流转服务创建失败"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  /* 处理删除 */
  const handleDelete = async (link: PaymentLink) => {
    if (!selectedKey) return
    if (!confirm("确定要删除这个在线积分流转服务吗？该操作不可恢复。")) return

    try {
      setLoading(true)
      await MerchantService.deletePaymentLink(selectedKey.id, link.id)
      toast.success("在线积分流转服务已删除")
      if (selectedLink?.id === link.id) {
        setSelectedLink(null)
      }
      fetchLinks()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "在线积分流转服务删除失败"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  /* 处理复制链接 */
  const handleCopyLink = (token: string) => {
    const url = `${ window.location.origin }/paying/online?token=${ token }`
    navigator.clipboard.writeText(url)
    toast.success("在线积分流转服务链接已复制")
  }

  /* 预览订单信息 */
  const previewOrderInfo: GetMerchantOrderResponse = {
    merchant: {
      app_name: selectedKey?.app_name || "服务名称",
      redirect_uri: "",
    },
    order: {
      id: 0,
      order_no: previewLink ? `LINK-${ previewLink.id }` : "PREVIEW",
      order_name: isCreating ? (productName || "服务名称") : (previewLink?.product_name || "服务名称"),
      payer_username: "user",
      payee_username: selectedKey?.app_name || "应用",
      amount: isCreating ? (amount || "0.00") : (previewLink?.amount || "0.00"),
      status: "pending",
      type: "payment",
      payment_type: "api",
      remark: isCreating ? remark : (previewLink?.remark || ""),
      client_id: "",
      return_url: "",
      notify_url: "",
      trade_time: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    user_pay_config: {
      id: 0,
      level: 1,
      min_score: 0,
      max_score: null,
      daily_limit: null,
      fee_rate: "0.00",
      created_at: "",
      updated_at: ""
    }
  }

  return (
    <div className="flex flex-col gap-6 py-6 box-border h-[calc(100vh-60px)]">
      <div className="flex items-center justify-between border-b border-border pb-2 shrink-0">
        <h1 className="text-2xl font-semibold">在线流转</h1>
        <div className="flex items-center gap-3">
          {apiKeys.length > 0 && (
            <MerchantSelector
              apiKeys={apiKeys}
              selectedKeyId={selectedKey?.id || null}
              onSelect={handleMerchantSelect}
            />
          )}
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleBack}>
            <ArrowLeft className="h-3 w-3" /> 返回
          </Button>
        </div>
      </div>

      {!selectedKey ? (
        <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg flex-1">
          <div className="rounded-lg p-3 bg-muted/50 mb-4">
            <Key className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-1">
            {apiKeys.length === 0 ? "暂未创建应用" : "未选择应用"}
          </h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
            {apiKeys.length === 0
              ? "您还没有创建任何应用。请前往集市中心创建一个应用，即可开始管理在线积分流转服务。"
              : "请先在右上角选择一个应用以管理此应用的所有在线积分流转服务。"}
          </p>
          {apiKeys.length === 0 && (
            <Button onClick={() => router.push('/merchant')} variant="default" size="sm">
              前往集市应用中心
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6 h-full min-h-0">
          <div className="space-y-4 shrink-0">
            <h2 className="font-semibold -mt-2">所有服务</h2>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-4 pb-3">
                <button
                  onClick={() => {
                    setIsCreating(true)
                    setSelectedLink(null)
                    setProductName("")
                    setAmount("")
                    setRemark("")
                  }}
                  className="rounded-lg p-4 border border-dashed hover:border-primary/50 shadow-none transition-all text-left group bg-background min-h-[100px] w-[180px] shrink-0 flex flex-col items-center justify-center gap-2"
                >
                  <div className="rounded-lg p-2 bg-purple-50 dark:bg-purple-950/20">
                    <Plus className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium text-sm group-hover:text-foreground">创建服务</h3>
                    <p className="text-xs text-muted-foreground">添加新的在线积分流转服务</p>
                  </div>
                </button>

                {loading && paymentLinks.length === 0 && (
                  <div className="flex items-center justify-center h-[100px] w-[180px] shrink-0">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )}

                {paymentLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => {
                      if (previewLink?.id === link.id) {
                        setSelectedLink(link)
                        setIsCreating(false)
                      } else {
                        setPreviewLink(link)
                        setIsCreating(false)
                        toast.info("再次点击打开详情", {
                          duration: 1500,
                          position: "bottom-center"
                        })
                      }
                    }}
                    className={`rounded-lg p-4 border border-dashed shadow-none transition-all text-left group bg-background min-h-[100px] w-[180px] shrink-0 flex flex-col justify-between ${ previewLink?.id === link.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{link.product_name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{link.remark || "无备注"}</p>
                      </div>
                      <div className="rounded-lg p-1.5 bg-green-50 dark:bg-green-950/20 shrink-0">
                        <CreditCard className="h-3 w-3 text-green-600" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-xs text-muted-foreground">LDC</span>
                      <span className="text-lg font-mono font-semibold">{parseFloat(link.amount).toFixed(2)}</span>
                    </div>
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between shrink-0">
                <h2 className="font-semibold">活动数据</h2>
              </div>
              <div className="h-[600px] overflow-hidden">
                <TransactionTableList
                  loading={loadingTransactions}
                  error={transactionsError}
                  transactions={transactions}
                  total={total}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onRetry={refresh}
                  onLoadMore={loadMore}
                  emptyDescription="暂无在线流转服务数据"
                />
              </div>
            </div>

            <div className={`space-y-4 ${ isFullscreen ? 'fixed inset-0 z-10 bg-background p-6' : '' }`}>
              <div className="flex items-center justify-between shrink-0">
                <h2 className="font-semibold">{isFullscreen ? '全屏预览' : '实时预览'}</h2>
              </div>
              <div className={`border-none overflow-hidden relative h-[600px] ${ isFullscreen ? 'border-0 rounded-none h-full' : '' }`}>
                <div className="absolute z-15 left-1/2 -translate-x-1/2">
                  <div className="h-8 bg-background border border-border rounded-full p-1.5 flex items-center gap-0.5 shadow-lg">
                    <Button variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'} size="icon" className="size-6 rounded-full" onClick={() => setPreviewDevice('mobile')}>
                      <Smartphone className="size-3.5" />
                    </Button>
                    <Button variant={previewDevice === 'tablet' ? 'secondary' : 'ghost'} size="icon" className="size-6 rounded-full" onClick={() => setPreviewDevice('tablet')}>
                      <Tablet className="size-3.5" />
                    </Button>
                    <Button variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'} size="icon" className="size-6 rounded-full" onClick={() => setPreviewDevice('desktop')}>
                      <Monitor className="size-3.5" />
                    </Button>
                    <div className="w-px h-5 bg-border mx-1" />
                    <Button variant="ghost" size="icon" className="size-6 rounded-full" onClick={() => setIsFullscreen(!isFullscreen)}>
                      {isFullscreen ? <Minimize className="size-3.5" /> : <Expand className="size-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="size-6 rounded-full" onClick={() => { const current = previewDevice; setPreviewDevice('mobile'); setTimeout(() => setPreviewDevice(current), 50) }}>
                      <RotateCw className="size-3.5" />
                    </Button>
                    <div className="w-px h-5 bg-border mx-1" />
                    <Button variant="ghost" size="icon" className="size-6 rounded-full" onClick={() => setPreviewTheme(previewTheme === 'dark' ? 'light' : 'dark')}>
                      {previewTheme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className={`flex justify-center items-center p-6 relative overflow-hidden h-full ${ isFullscreen ? 'min-h-screen' : '' }`}>
                  <div className="absolute inset-0 pattern-grid-lg opacity-5" />
                  <motion.div
                    layout
                    initial={false}
                    animate={{
                      width: previewDevice === 'mobile' ? 375 : previewDevice === 'tablet' ? 768 : 1200,
                      height: previewDevice === 'mobile' ? 812 : previewDevice === 'tablet' ? 1024 : 750,
                      borderRadius: previewDevice === 'mobile' ? 50 : previewDevice === 'tablet' ? 32 : 16,
                      borderWidth: previewDevice === 'mobile' ? 14 : previewDevice === 'tablet' ? 18 : 8,
                      scale: previewDevice === 'mobile' ? 0.6 : previewDevice === 'tablet' ? 0.45 : 0.35,
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className="shrink-0 overflow-hidden shadow-2xl bg-black relative border-[#1f1f1f] origin-center rounded-[50px]"
                  >
                    <AnimatePresence>
                      {previewDevice === 'mobile' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" key="mobile-frame">
                          <div className="absolute top-[11px] left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full flex items-center justify-center gap-3 shadow-sm border border-white/5">
                            <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0f0f0f]" />
                          </div>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/20 rounded-full" />
                        </motion.div>
                      )}
                      {previewDevice === 'tablet' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-0 left-0 w-full h-full pointer-events-none z-50" key="tablet-frame">
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gray-600 border border-gray-500" />
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/20 rounded-full" />
                        </motion.div>
                      )}
                      {previewDevice === 'desktop' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-0 left-0 w-full h-full pointer-events-none z-50" key="desktop-frame">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-8 bg-[#1f1f1f] rounded-b-xl flex items-center justify-center border-b border-x border-black/50">
                            <div className="w-1.5 h-1.5 rounded-full bg-black/50" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className={`h-full w-full overflow-y-auto custom-scrollbar flex items-center justify-center p-4 ${ previewTheme === 'dark' ? 'dark bg-zinc-900' : 'bg-white' }`}>
                      <div className={`flex ${ previewDevice === 'mobile' ? 'flex-col' : 'flex-row' } w-full max-w-4xl backdrop-blur-2xl border rounded-3xl overflow-hidden shadow-2xl relative shrink-0 ${ previewTheme === 'dark' ? 'bg-card/70 border-border/50' : 'bg-white border-gray-200' }`}>
                        <PayingInfo orderInfo={previewOrderInfo} loading={loading} forceMobile={previewDevice === 'mobile'} />
                        <PayingNow orderInfo={previewOrderInfo} paying={false} payKey="" currentStep="method" selectedMethod="alipay" isOpen={false} loading={false} onPayKeyChange={() => { }} onCurrentStepChange={() => { }} onSelectedMethodChange={() => { }} onIsOpenChange={() => { }} onPayOrder={() => { }} forceMobile={previewDevice === 'mobile'} />
                        <div className="absolute inset-0 z-50 bg-transparent cursor-default" />
                      </div>
                    </div>
                    <div className="absolute inset-0 z-40 bg-transparent cursor-default" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          <Sheet open={isCreating || !!selectedLink} onOpenChange={(open) => { if (!open) { setIsCreating(false); setSelectedLink(null); } }}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto custom-scrollbar px-6">
              {isCreating ? (
                <div className="space-y-6">
                  <SheetHeader>
                    <SheetTitle>创建新服务</SheetTitle>
                    <SheetDescription>创建一个在线积分流转服务。</SheetDescription>
                  </SheetHeader>

                  <div className="border border-dashed rounded-lg p-4 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">服务名称 <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder="例如：高级会员订阅服务"
                        value={productName}
                        onChange={e => setProductName(e.target.value)}
                        maxLength={50}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">积分 (LDC) <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="font-mono"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">备注 (可选)</Label>
                      <Textarea
                        placeholder="服务备注信息..."
                        className="resize-none h-20"
                        value={remark}
                        onChange={e => setRemark(e.target.value)}
                        maxLength={200}
                      />
                    </div>
                  </div>

                  <SheetFooter className="flex flex-row justify-end items-center gap-2">
                    <Button variant="ghost" onClick={() => setIsCreating(false)} className="h-8 text-xs">取消</Button>
                    <Button onClick={handleCreate} disabled={loading} className="bg-primary hover:bg-primary/90 h-8 text-xs">
                      {loading && <Spinner className="mr-1 h-3 w-3" />} 创建
                    </Button>
                  </SheetFooter>
                </div>
              ) : selectedLink ? (
                <div className="space-y-6">
                  <SheetHeader>
                    <SheetTitle>{selectedLink.product_name}</SheetTitle>
                    <SheetDescription>服务管理</SheetDescription>
                  </SheetHeader>

                  <div>
                    <h2 className="text-sm font-semibold mb-4">服务信息</h2>
                    <div className="border border-dashed rounded-lg">
                      <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
                        <label className="text-xs font-medium text-muted-foreground">服务名称</label>
                        <p className="text-xs font-medium truncate text-right max-w-[70%]">{selectedLink.product_name}</p>
                      </div>
                      <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
                        <label className="text-xs font-medium text-muted-foreground">积分 (LDC)</label>
                        <p className="text-sm font-mono font-bold text-primary">LDC {parseFloat(selectedLink.amount).toFixed(2)}</p>
                      </div>
                      <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
                        <label className="text-xs font-medium text-muted-foreground">创建时间</label>
                        <p className="text-xs text-muted-foreground">{new Date(selectedLink.created_at).toLocaleString()}</p>
                      </div>
                      <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
                        <label className="text-xs font-medium text-muted-foreground">备注</label>
                        <p className="text-xs text-muted-foreground truncate text-right max-w-[70%]">{selectedLink.remark || "无备注"}</p>
                      </div>
                      <div className="px-3 py-2 border-b border-dashed last:border-b-0">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-muted-foreground shrink-0">服务令牌</label>
                          <div className="flex items-center p-1 h-7 border border-dashed rounded-sm bg-background max-w-[200px]">
                            <code className="text-xs text-muted-foreground font-mono flex-1 overflow-x-auto px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] whitespace-nowrap">
                              {showToken ? selectedLink.token : '•'.repeat(36)}
                            </code>
                            <Button
                              variant="ghost"
                              className="p-0.5 w-5 h-5 shrink-0"
                              onClick={() => setShowToken(!showToken)}
                            >
                              {showToken ? <EyeOff className="size-2.5 text-muted-foreground" /> : <Eye className="size-2.5 text-muted-foreground" />}
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => handleCopyLink(selectedLink.token)}
                              className="p-0.5 w-5 h-5 shrink-0"
                            >
                              <Copy className="size-2.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold mb-4">流转服务管理</h2>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" className="text-xs h-8 border-dashed border-green-500 hover:bg-green-50 shadow-none" onClick={() => handleCopyLink(selectedLink.token)}>
                        <Copy className="size-3 mr-1" />
                        复制链接
                      </Button>
                      <Button variant="outline" className="text-xs h-8 border-dashed border-green-500 hover:bg-green-50 shadow-none" onClick={() => window.open(`/paying/online?token=${ selectedLink.token }`, '_blank')}>
                        <ExternalLink className="size-3 mr-1" />
                        查看服务
                      </Button>
                      <Button variant="outline" className="text-xs text-destructive h-8 border-dashed border-destructive/50 hover:bg-destructive/5 shadow-none" onClick={() => handleDelete(selectedLink)}>
                        <Trash2 className="size-3 mr-1" />
                        删除服务
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  )
}
