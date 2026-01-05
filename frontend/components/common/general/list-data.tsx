
import * as React from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { TablePagination, FilterSelect } from "@/components/common/general/table-filter"
import { Inbox, ListRestart, Gift, Coins, Check, Copy, ExternalLink } from "lucide-react"
import { EmptyStateWithBorder } from "@/components/layout/empty"
import { LoadingStateWithBorder } from "@/components/layout/loading"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/utils"
import type { RedEnvelope } from "@/lib/services"

export interface ListDataProps {
  fetchData: (params: { page: number, page_size: number, type: string }) => Promise<{ list: RedEnvelope[], total: number }>
  tabs: { value: string, label: string, color?: string }[]
  defaultTab?: string
  pageSize?: number
  className?: string
  emptyState?: (tab: string) => React.ReactNode
  refreshTrigger?: number
}

/**
 * 红包列表数据组件
 * 
 * 提供分页、标签筛选、数据加载状态管理和网格布局，专门用于展示红包列表
 */
export function ListData({
  fetchData,
  tabs,
  defaultTab,
  pageSize = 20,
  className,
  emptyState,
  refreshTrigger = 0
}: ListDataProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.value)

  /* 数据状态 */
  const [items, setItems] = useState<RedEnvelope[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [currentPageSize, setCurrentPageSize] = useState(pageSize)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  /* 缓存页码 */
  const loadData = async (type: string, p: number, s: number) => {
    setLoading(true)
    try {
      const result = await fetchData({ page: p, page_size: s, type })
      setItems(result.list)
      setTotal(result.total)
    } catch (error) {
      toast.error('加载数据失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  /* 初始加载和Tab切换 */
  useEffect(() => {
    setPage(1)
    loadData(activeTab, 1, currentPageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, refreshTrigger])

  const handlePageChange = (p: number) => {
    setPage(p)
    loadData(activeTab, p, currentPageSize)
  }

  const handlePageSizeChange = (s: number) => {
    setCurrentPageSize(s)
    setPage(1)
    loadData(activeTab, 1, s)
  }

  const totalPages = Math.ceil(total / currentPageSize)

  const getEnvelopeLink = (id: string) => {
    if (typeof window !== 'undefined') {
      return `${ window.location.origin }/redenvelope/${ id }`
    }
    return `/redenvelope/${ id }`
  }

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 leading-none text-green-600 bg-green-50/50 border-green-200">进行中</Badge>
      case 'finished':
        return <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 leading-none text-muted-foreground bg-muted/50 border-dashed">已领完</Badge>
      case 'expired':
        return <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 leading-none text-red-500 bg-red-50/50 border-red-200">已过期</Badge>
      default:
        return <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 leading-none">{status}</Badge>
    }
  }

  /* 默认空状态 */
  const defaultEmptyState = (
    <EmptyStateWithBorder
      icon={Inbox}
      description="暂无数据"
    />
  )

  return (
    <div className={className}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <FilterSelect<string>
            label="视图"
            selectedValues={[activeTab]}
            options={tabs.reduce((acc, tab) => ({
              ...acc,
              [tab.value]: { label: tab.label, color: tab.color }
            }), {})}
            onToggleValue={(v) => setActiveTab(v)}
          />
        </div>

        <TablePagination
          currentPage={totalPages > 0 ? page : 0}
          totalPages={totalPages}
          total={total}
          pageSize={currentPageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onRefresh={() => loadData(activeTab, page, currentPageSize)}
          loading={loading}
        />
      </div>

      <div className="space-y-4">
        {loading && items.length === 0 ? (
          <LoadingStateWithBorder icon={ListRestart} />
        ) : items.length === 0 ? (
          emptyState ? emptyState(activeTab) : defaultEmptyState
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((envelope) => {
              const isSent = activeTab === 'sent'
              const link = getEnvelopeLink(envelope.id)
              const claimedCount = envelope.total_count - envelope.remaining_count

              return (
                <Card
                  key={envelope.id}
                  className="group border-dashed hover:bg-muted/30 transition-all bg-card/50 shadow-none"
                >
                  <CardContent className="px-4 py-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${ isSent
                          ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
                          : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30"
                          }`}>
                          {isSent ? <Gift size={16} /> : <Coins size={16} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-foreground truncate select-none">
                              {isSent
                                ? (envelope.type === 'random' ? '拼手气红包' : '普通红包')
                                : envelope.creator_username
                              }
                            </span>
                            {getStatusBadge(envelope.status)}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[140px] mt-0.5">
                            {envelope.greeting || "恭喜发财，大吉大利"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2.5 px-2.5 py-2 bg-muted/40 rounded-md text-xs">
                      <div>
                        <div className="text-[10px] text-muted-foreground/70 mb-0.5 scale-95 origin-left">总金额</div>
                        <div className="font-mono font-medium text-foreground">{envelope.total_amount}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground/70 mb-0.5 scale-95 origin-left">已领取</div>
                        <div className="font-medium text-foreground">{claimedCount}/{envelope.total_count}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 -mb-2">
                      <div className="text-[10px] text-muted-foreground/60 font-mono">
                        {formatDateTime(envelope.created_at)}
                      </div>

                      <div className="flex gap-1 h-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 hover:bg-background hover:text-primary transition-all"
                          onClick={() => handleCopyLink(link, envelope.id)}
                        >
                          {copiedId === envelope.id ? (
                            <Check className="size-3 text-green-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 hover:bg-background hover:text-primary transition-all"
                          onClick={() => window.open(link, '_blank')}
                        >
                          <ExternalLink className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
