"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { Key, Smartphone, Tablet, Monitor, RotateCw, Plus, Trash2, Copy, ExternalLink, CreditCard, Store, Loader2, Eye, EyeOff, Expand, Minimize, Sun, Moon } from "lucide-react"
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
import { useUser } from "@/contexts/user-context"
import { MerchantService, ConfigService, type PaymentLink, type GetMerchantOrderResponse, type MerchantAPIKey, type UserPayConfig } from "@/lib/services"
import { PayingInfo } from "@/components/common/pay/paying/paying-info"
import { PayingNow } from "@/components/common/pay/paying/paying-now"
import { MerchantSelector } from "@/components/common/merchant/merchant-selector"
import { LoadingPage } from "@/components/layout/loading"
import { EmptyState } from "@/components/layout/empty"
import { TransactionTableList } from "@/components/common/general/table-data"

/** 设备预览配置 */
const DEVICE_CONFIG = {
  mobile: {
    width: 375,
    height: 812,
    borderRadius: 50,
    borderWidth: 14,
    scale: 0.6
  },
  tablet: {
    width: 768,
    height: 1024,
    borderRadius: 32,
    borderWidth: 18,
    scale: 0.45
  },
  desktop: {
    width: 1200,
    height: 750,
    borderRadius: 16,
    borderWidth: 8,
    scale: 0.35
  }
} as const

export function MerchantOnline() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { apiKeys, loading: loadingKeys, loadAPIKeys } = useMerchant()

  useEffect(() => {
    loadAPIKeys()
  }, [loadAPIKeys])
  const apiKeyId = searchParams.get("apiKeyId")
  const selectedKey = apiKeys.find(k => k.id.toString() === apiKeyId) || null

  if (loadingKeys) {
    return <LoadingPage text="在线流转" badgeText="积分" />
  }

  if (apiKeys.length === 0) {
    return (
      <div className="py-6">
        <div className="flex items-center justify-between border-b pb-2 mb-4 shrink-0">
          <h1 className="text-2xl font-semibold">在线流转</h1>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => router.push('/merchant')}>
            <Store className="size-3 mr-1" /> 前往集市
          </Button>
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <EmptyState
            title="暂未创建应用"
            description="您还没有创建任何应用。请前往集市中心创建应用，即可开始使用在线积分流转服务。"
            icon={Key}
          />
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
      <MerchantOnlineContent apiKeys={apiKeys} />
    </TransactionProvider>
  )
}

interface MerchantOnlineContentProps {
  apiKeys: MerchantAPIKey[]
}

function MerchantOnlineContent({ apiKeys }: MerchantOnlineContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    transactions,
    loading: loadingTransactions,
    error: transactionsError,
    fetchTransactions,
    refresh
  } = useTransaction()

  /* 派生 selectedKey */
  const apiKeyId = searchParams.get("apiKeyId")

  /* 处理集市应用切换 */
  const handleMerchantSelect = useCallback((id: string) => {
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
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  /* 创建/编辑表单状态 */
  const [productName, setProductName] = useState("")
  const [amount, setAmount] = useState("")
  const [remark, setRemark] = useState("")
  const [totalLimit, setTotalLimit] = useState("")
  const [userLimit, setUserLimit] = useState("")

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

    // 验证限制字段
    if (totalLimit && (isNaN(parseInt(totalLimit)) || parseInt(totalLimit) < 1)) {
      toast.error("总数量限制必须是大于0的整数")
      return
    }
    if (userLimit && (isNaN(parseInt(userLimit)) || parseInt(userLimit) < 1)) {
      toast.error("单用户限制必须是大于0的整数")
      return
    }

    try {
      setLoading(true)
      const newLink = await MerchantService.createPaymentLink(selectedKey.id, {
        product_name: productName,
        amount: parseFloat(amount),
        remark,
        ...(totalLimit && { total_limit: parseInt(totalLimit) }),
        ...(userLimit && { user_limit: parseInt(userLimit) })
      })
      toast.success("在线积分流转服务创建成功")
      /* 重置表单 */
      setProductName("")
      setAmount("")
      setRemark("")
      setTotalLimit("")
      setUserLimit("")

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

  /* 处理编辑 */
  const handleEdit = (link: PaymentLink) => {
    setProductName(link.product_name)
    setAmount(link.amount)
    setRemark(link.remark || "")
    setTotalLimit(link.total_limit?.toString() || "")
    setUserLimit(link.user_limit?.toString() || "")
    setIsEditing(true)
  }

  /* 处理更新 */
  const handleUpdate = async () => {
    if (!selectedKey || !selectedLink) return
    if (!productName || !amount) {
      toast.error("请填写在线积分流转服务的名称和数量")
      return
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("积分数量必须设置为大于0的数值")
      return
    }

    // 验证限制字段
    if (totalLimit && (isNaN(parseInt(totalLimit)) || parseInt(totalLimit) < 1)) {
      toast.error("总数量限制必须是大于0的整数")
      return
    }
    if (userLimit && (isNaN(parseInt(userLimit)) || parseInt(userLimit) < 1)) {
      toast.error("单用户限制必须是大于0的整数")
      return
    }

    try {
      setLoading(true)
      await MerchantService.updatePaymentLink(selectedKey.id, selectedLink.id, {
        product_name: productName,
        amount: parseFloat(amount),
        remark,
        ...(totalLimit && { total_limit: parseInt(totalLimit) }),
        ...(userLimit && { user_limit: parseInt(userLimit) })
      })
      toast.success("在线积分流转服务已更新")

      /* 更新UI */
      fetchLinks()
      setIsEditing(false)
      setSelectedLink(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "在线积分流转服务更新失败"
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

  /* 获取用户支付配置 */
  const [userPayConfigs, setUserPayConfigs] = useState<UserPayConfig[]>([])
  const { user } = useUser()

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const configs = await ConfigService.getUserPayConfigs()
        setUserPayConfigs(configs)
      } catch (error) {
        console.error("Failed to load user pay configs:", error)
      }
    }
    loadConfigs()
  }, [])

  /* 预览订单信息 */
  const currentUserConfig = userPayConfigs.find(c => user?.pay_level !== undefined && c.level === user.pay_level)

  const previewOrderInfo: GetMerchantOrderResponse = {
    merchant: {
      app_name: selectedKey?.app_name || "服务名称",
      redirect_uri: "",
    },
    order: {
      id: '0',
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
    user_pay_config: currentUserConfig ? {
      ...currentUserConfig,
      fee_rate: String(currentUserConfig.fee_rate)
    } : {
      id: '0',
      level: user?.pay_level ?? 0,
      min_score: 0,
      max_score: null,
      daily_limit: null,
      fee_rate: "0.00",
      created_at: "",
      updated_at: ""
    }
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between border-b pb-2 mb-4 shrink-0">
        <h1 className="text-2xl font-semibold">在线流转</h1>
        <div className="flex items-center gap-3">
          {apiKeys.length > 0 && (
            <MerchantSelector
              apiKeys={apiKeys}
              selectedKeyId={selectedKey?.id || null}
              onSelect={handleMerchantSelect}
            />
          )}
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => router.push('/merchant')}>
            <Store className="size-3 mr-1" /> 前往集市
          </Button>
        </div>
      </div>

      {!selectedKey ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <EmptyState
            title={apiKeys.length === 0 ? "暂未创建应用" : "未选择应用"}
            description={apiKeys.length === 0
              ? "您还没有创建任何应用。请前往集市中心创建一个应用，即可开始管理在线积分流转服务。"
              : "请先在右上角选择一个应用以管理此应用的所有在线积分流转服务。"}
            icon={Key}
          />
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
                    setTotalLimit("")
                    setUserLimit("")
                  }}
                  className="rounded-lg p-4 border border-dashed hover:border-primary/50 shadow-none transition-all text-left group bg-background min-h-[100px] w-[180px] shrink-0 flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <div className="rounded-lg p-2 bg-purple-50 dark:bg-purple-950/20">
                    <Plus className="size-4 text-purple-600" />
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
                        <CreditCard className="size-3 text-green-600" />
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
                  onRetry={refresh}
                  emptyDescription="暂无在线流转服务数据"
                />
              </div>
            </div>

            <div className={`space-y-4 ${ isFullscreen ? 'fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-6 flex flex-col' : '' }`}>
              <div className="flex items-center justify-between shrink-0">
                <h2 className="font-semibold">{isFullscreen ? '全屏预览' : '实时预览'}</h2>
              </div>
              <div className={`border-none overflow-hidden relative h-[600px] ${ isFullscreen ? 'border-0 rounded-none h-full flex-1' : '' }`}>
                <div className="absolute z-15 left-1/2 -translate-x-1/2 top-4">
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
                      width: DEVICE_CONFIG[previewDevice].width,
                      height: DEVICE_CONFIG[previewDevice].height,
                      borderRadius: DEVICE_CONFIG[previewDevice].borderRadius,
                      borderWidth: DEVICE_CONFIG[previewDevice].borderWidth,
                      scale: isFullscreen
                        ? (previewDevice === 'mobile' ? 0.9 : previewDevice === 'tablet' ? 0.75 : 0.65)
                        : DEVICE_CONFIG[previewDevice].scale,
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

                    <div className={`h-full w-full overflow-y-auto custom-scrollbar flex items-center justify-center p-4 transition-colors duration-500 ${ previewTheme === 'dark' ? 'dark bg-zinc-900' : 'bg-white' }`}>
                      <div className={`flex ${ previewDevice === 'mobile' ? 'flex-col' : 'flex-row' } w-full max-w-4xl backdrop-blur-2xl border rounded-3xl overflow-hidden shadow-2xl relative shrink-0 transition-colors duration-500 ${ previewTheme === 'dark' ? 'bg-card/70 border-border/50' : 'bg-white border-gray-200' }`}>
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
            <SheetContent className="w-full sm:max-w-md overflow-y-auto custom-scrollbar px-4">
              {isCreating ? (
                <div className="space-y-6">
                  <SheetHeader className="px-0">
                    <SheetTitle>创建新服务</SheetTitle>
                    <SheetDescription className="text-xs">创建一个在线积分流转服务。</SheetDescription>
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
                      <Label className="text-xs font-medium text-muted-foreground">总次数限制 (可选)</Label>
                      <Input
                        type="number"
                        placeholder="不限制"
                        min="1"
                        value={totalLimit}
                        onChange={e => setTotalLimit(e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground">设置该链接总共可以支付的次数</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">单用户限制 (可选)</Label>
                      <Input
                        type="number"
                        placeholder="不限制"
                        min="1"
                        value={userLimit}
                        onChange={e => setUserLimit(e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground">设置每个用户最多可以支付的次数</p>
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
                    <Button onClick={handleCreate} disabled={loading} className="h-8 text-xs">
                      {loading && <Spinner className="mr-1 size-3" />} 创建
                    </Button>
                  </SheetFooter>
                </div>
              ) : selectedLink ? (
                <div className="space-y-6">
                  <SheetHeader className="px-0">
                    <SheetTitle>{selectedLink.product_name}</SheetTitle>
                    <SheetDescription className="text-xs">
                      {isEditing ? "编辑在线积分流转服务信息" : "在线积分流转服务内容详情"}
                    </SheetDescription>
                  </SheetHeader>

                  {isEditing ? (
                    /* 编辑模式 */
                    <div className="space-y-6">
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
                          <Label className="text-xs font-medium text-muted-foreground">总次数限制 (可选)</Label>
                          <Input
                            type="number"
                            placeholder="不限制"
                            min="1"
                            value={totalLimit}
                            onChange={e => setTotalLimit(e.target.value)}
                          />
                          <p className="text-[10px] text-muted-foreground">设置该链接总共可以支付的次数</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">单用户限制 (可选)</Label>
                          <Input
                            type="number"
                            placeholder="不限制"
                            min="1"
                            value={userLimit}
                            onChange={e => setUserLimit(e.target.value)}
                          />
                          <p className="text-[10px] text-muted-foreground">设置每个用户最多可以支付的次数</p>
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
                        <Button variant="ghost" onClick={() => setIsEditing(false)} className="h-8 text-xs">取消</Button>
                        <Button onClick={handleUpdate} disabled={loading} className="h-8 text-xs">
                          {loading && <Spinner className="mr-1 size-3" />} 保存
                        </Button>
                      </SheetFooter>
                    </div>
                  ) : (
                    /* 查看模式 */
                    <>
                      <div>
                        <h2 className="text-sm font-semibold mb-4">服务信息</h2>
                        <div className="border border-dashed rounded-lg">
                          <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
                            <label className="text-xs font-medium text-muted-foreground">服务名称</label>
                            <p className="text-xs font-medium truncate text-right max-w-[70%]">{selectedLink.product_name}</p>
                          </div>
                          <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
                            <label className="text-xs font-medium text-muted-foreground">积分数量</label>
                            <p className="text-xs font-bold text-primary">LDC {parseFloat(selectedLink.amount).toFixed(2)}</p>
                          </div>

                          {(selectedLink.total_limit || selectedLink.user_limit) && (
                            <>
                              {selectedLink.total_limit && (
                                <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
                                  <label className="text-xs font-medium text-muted-foreground">总次数限制</label>
                                  <p className="text-xs font-medium">{selectedLink.total_limit}</p>
                                </div>
                              )}
                              {selectedLink.user_limit && (
                                <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
                                  <label className="text-xs font-medium text-muted-foreground">单用户限制</label>
                                  <p className="text-xs font-medium">{selectedLink.user_limit}</p>
                                </div>
                              )}
                            </>
                          )}
                          <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
                            <label className="text-xs font-medium text-muted-foreground">服务备注</label>
                            <p className="text-xs text-muted-foreground truncate text-right max-w-[70%]">{selectedLink.remark || "无备注"}</p>
                          </div>
                          <div className="px-3 py-2 flex items-center justify-between border-b border-dashed last:border-b-0">
                            <label className="text-xs font-medium text-muted-foreground">创建时间</label>
                            <p className="text-xs text-muted-foreground">{new Date(selectedLink.created_at).toLocaleString()}</p>
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
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" className="text-xs h-8 border-dashed border-green-500 hover:bg-green-50 shadow-none" onClick={() => handleCopyLink(selectedLink.token)}>
                            <Copy className="size-3 mr-1" />
                            复制链接
                          </Button>
                          <Button variant="outline" className="text-xs h-8 border-dashed border-green-500 hover:bg-green-50 shadow-none" onClick={() => window.open(`/paying/online?token=${ selectedLink.token }`, '_blank')}>
                            <ExternalLink className="size-3 mr-1" />
                            查看服务
                          </Button>
                          <Button variant="outline" className="text-xs h-8 border-dashed border-blue-500 hover:bg-blue-50 shadow-none" onClick={() => handleEdit(selectedLink)}>
                            <svg className="size-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            编辑服务
                          </Button>
                          <Button variant="outline" className="text-xs text-destructive h-8 border-dashed border-destructive/50 hover:bg-destructive/5 shadow-none" onClick={() => handleDelete(selectedLink)}>
                            <Trash2 className="size-3 mr-1" />
                            删除服务
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      )
      }
    </div >
  )
}
