"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Eye, Layers, Loader2, ReceiptText, RotateCw, Search, Undo2, X } from "lucide-react"

import { AdminService, type AdminOrder, type AdminOrderStatus, type AdminOrderType, type ListAdminOrdersRequest } from "@/lib/services"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ErrorInline } from "@/components/layout/error"
import { EmptyStateWithBorder } from "@/components/layout/empty"
import { LoadingStateWithBorder } from "@/components/layout/loading"
import { FilterSelect, TablePagination, statusConfig } from "@/components/common/general/table-filter"
import { DisputeHistoryTimeline } from "@/components/common/general/dispute-dialog"
import { cn, formatDateTime } from "@/lib/utils"

const ADMIN_TYPE_CONFIG: Record<AdminOrderType, { label: string; color: string }> = {
  payment: { label: "积分消耗", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  transfer: { label: "积分转账", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  community: { label: "社区划转", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
  online: { label: "在线活动", color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300" },
  test: { label: "应用测试", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 font-bold" },
  distribute: { label: "商户分发", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300" },
  red_envelope_send: { label: "红包支出", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  red_envelope_receive: { label: "红包收入", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  red_envelope_refund: { label: "红包退款", color: "bg-muted/50 text-gray-800 dark:bg-gray-900 dark:text-gray-300" },
}

const ADMIN_STATUS_CONFIG = statusConfig as Record<AdminOrderStatus, { label: string; color: string }>

const TRANSFER_STATUS_LABEL: Record<string, string> = {
  pending: "结算中",
  completed: "已结算",
}

const DISPUTE_STATUS_LABEL: Record<string, string> = {
  disputing: "处理中",
  refund: "已退款",
  closed: "已关闭",
}

interface SearchValues {
  id: string
  order_name: string
  client_id: string
  merchant_order_no: string
  payer_username: string
  payee_username: string
}

const EMPTY_SEARCH: SearchValues = {
  id: "",
  order_name: "",
  client_id: "",
  merchant_order_no: "",
  payer_username: "",
  payee_username: "",
}

function toISODateTime(value: string, endOfDay = false) {
  if (!value) return undefined
  const time = endOfDay ? "23:59:59" : "00:00:00"
  return new Date(`${ value }T${ time }`).toISOString()
}

function isRefundable(order: AdminOrder) {
  return (order.type === "payment" || order.type === "online")
    && (order.status === "success" || order.status === "disputing" || order.status === "refused")
}

function displayAmount(amount: string) {
  return Number.parseFloat(amount).toFixed(2)
}

function userInitial(username?: string) {
  return username ? username.substring(0, 1).toUpperCase() : "-"
}

export function OrdersManager() {
  const [orders, setOrders] = React.useState<AdminOrder[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const [selectedTypes, setSelectedTypes] = React.useState<AdminOrderType[]>([])
  const [selectedStatuses, setSelectedStatuses] = React.useState<AdminOrderStatus[]>([])
  const [searchValues, setSearchValues] = React.useState<SearchValues>(EMPTY_SEARCH)
  const [draftSearchValues, setDraftSearchValues] = React.useState<SearchValues>(EMPTY_SEARCH)
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const [selectedOrder, setSelectedOrder] = React.useState<AdminOrder | null>(null)
  const [disputeOrder, setDisputeOrder] = React.useState<AdminOrder | null>(null)
  const [refundOrder, setRefundOrder] = React.useState<AdminOrder | null>(null)
  const [refundRemark, setRefundRemark] = React.useState("")
  const [refunding, setRefunding] = React.useState(false)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasSearchValues = Object.values(searchValues).some(Boolean)
  const hasDateFilter = Boolean(startDate || endDate)

  const buildRequest = React.useCallback((targetPage: number): ListAdminOrdersRequest => ({
    page: targetPage,
    page_size: pageSize,
    types: selectedTypes.length ? selectedTypes : undefined,
    statuses: selectedStatuses.length ? selectedStatuses : undefined,
    start_time: toISODateTime(startDate),
    end_time: toISODateTime(endDate, true),
    id: searchValues.id || undefined,
    order_name: searchValues.order_name || undefined,
    client_id: searchValues.client_id || undefined,
    merchant_order_no: searchValues.merchant_order_no || undefined,
    payer_username: searchValues.payer_username || undefined,
    payee_username: searchValues.payee_username || undefined,
  }), [endDate, pageSize, searchValues, selectedStatuses, selectedTypes, startDate])

  const fetchOrders = React.useCallback(async (targetPage: number) => {
    try {
      setLoading(true)
      setError(null)
      const response = await AdminService.listOrders(buildRequest(targetPage))
      setOrders(response.orders)
      setTotal(response.total)
      setPage(response.page)
      setPageSize(response.page_size)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("加载订单列表失败"))
    } finally {
      setLoading(false)
    }
  }, [buildRequest])

  React.useEffect(() => {
    fetchOrders(1)
  }, [fetchOrders])

  const handleApplySearch = () => {
    setSearchValues({ ...draftSearchValues })
    setPage(1)
  }

  const handleClearFilters = () => {
    setSelectedTypes([])
    setSelectedStatuses([])
    setSearchValues(EMPTY_SEARCH)
    setDraftSearchValues(EMPTY_SEARCH)
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  const handleRefund = async () => {
    if (!refundOrder) return

    try {
      setRefunding(true)
      await AdminService.refundOrder(refundOrder.id, {
        remark: refundRemark.trim() || undefined,
      })
      toast.success("退款成功", {
        description: `订单 ${ refundOrder.order_no } 已退款`,
      })
      setRefundOrder(null)
      setRefundRemark("")
      await fetchOrders(page)
    } catch (err) {
      toast.error("退款失败", {
        description: err instanceof Error ? err.message : "未知错误",
      })
    } finally {
      setRefunding(false)
    }
  }

  const activeFilter = selectedTypes.length > 0 || selectedStatuses.length > 0 || hasSearchValues || hasDateFilter

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="text-2xl font-semibold">订单管理</div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <OrderSearchFilter
            values={draftSearchValues}
            applied={hasSearchValues}
            onChange={setDraftSearchValues}
            onApply={handleApplySearch}
            onClear={() => {
              setDraftSearchValues(EMPTY_SEARCH)
              setSearchValues(EMPTY_SEARCH)
              setPage(1)
            }}
          />
          <FilterSelect<AdminOrderType>
            label="类型"
            selectedValues={selectedTypes}
            options={ADMIN_TYPE_CONFIG}
            onToggleValue={(type) => {
              setPage(1)
              setSelectedTypes(prev => prev.includes(type) ? prev.filter(item => item !== type) : [...prev, type])
            }}
          />
          <FilterSelect<AdminOrderStatus>
            label="状态"
            selectedValues={selectedStatuses}
            options={ADMIN_STATUS_CONFIG}
            onToggleValue={(status) => {
              setPage(1)
              setSelectedStatuses(prev => prev.includes(status) ? prev.filter(item => item !== status) : [...prev, status])
            }}
          />
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onStartChange={(value) => {
              setStartDate(value)
              setPage(1)
            }}
            onEndChange={(value) => {
              setEndDate(value)
              setPage(1)
            }}
          />
          {activeFilter && (
            <>
              <Separator orientation="vertical" className="h-6 hidden sm:block" />
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-2 lg:px-3 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                onClick={handleClearFilters}
              >
                <X className="size-3" />
                清空筛选
              </Button>
            </>
          )}
        </div>

        <Separator className="lg:hidden" />

        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={(targetPage) => {
            setPage(targetPage)
            fetchOrders(targetPage)
          }}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
          onRefresh={() => fetchOrders(page)}
          loading={loading}
        />
      </div>

      {error ? (
        <div className="p-8 border border-dashed rounded-lg">
          <ErrorInline error={error} onRetry={() => fetchOrders(page)} className="justify-center" />
        </div>
      ) : loading && orders.length === 0 ? (
        <LoadingStateWithBorder icon={ReceiptText} description="加载订单列表中..." />
      ) : orders.length === 0 ? (
        <EmptyStateWithBorder icon={ReceiptText} description="暂无订单数据" />
      ) : (
        <OrdersTable
          orders={orders}
          loading={loading}
          onShowDetail={setSelectedOrder}
          onShowDispute={setDisputeOrder}
          onRefund={(order) => {
            setRefundOrder(order)
            setRefundRemark("")
          }}
        />
      )}

      <OrderDetailSheet order={selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)} />
      <AdminDisputeDialog order={disputeOrder} onOpenChange={(open) => !open && setDisputeOrder(null)} />
      <RefundDialog
        order={refundOrder}
        remark={refundRemark}
        refunding={refunding}
        onRemarkChange={setRefundRemark}
        onOpenChange={(open) => {
          if (!open && !refunding) {
            setRefundOrder(null)
            setRefundRemark("")
          }
        }}
        onConfirm={handleRefund}
      />
    </div>
  )
}

function OrderSearchFilter({
  values,
  applied,
  onChange,
  onApply,
  onClear,
}: {
  values: SearchValues
  applied: boolean
  onChange: (values: SearchValues) => void
  onApply: () => void
  onClear: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-5 border-dashed text-[10px] font-medium shadow-none focus-visible:ring-0", applied && "bg-primary/5 border-primary/20")}
        >
          <Search className="size-3" />
          搜索
          {applied && (
            <>
              <Separator orientation="vertical" className="mx-1 h-3" />
              <Badge variant="secondary" className="text-[10px] h-3 px-1 rounded-full bg-primary text-primary-foreground">!</Badge>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[320px] p-4" align="start">
        <div className="grid grid-cols-2 gap-3">
          <SearchInput label="订单 ID" value={values.id} onChange={(value) => onChange({ ...values, id: value })} />
          <SearchInput label="订单名称" value={values.order_name} onChange={(value) => onChange({ ...values, order_name: value })} />
          <SearchInput label="Client ID" value={values.client_id} onChange={(value) => onChange({ ...values, client_id: value })} />
          <SearchInput label="业务单号" value={values.merchant_order_no} onChange={(value) => onChange({ ...values, merchant_order_no: value })} />
          <SearchInput label="消费方" value={values.payer_username} onChange={(value) => onChange({ ...values, payer_username: value })} />
          <SearchInput label="服务方" value={values.payee_username} onChange={(value) => onChange({ ...values, payee_username: value })} />
        </div>
        <div className="flex gap-2 pt-4">
          <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={onClear}>重置</Button>
          <Button size="sm" className="flex-1 h-7 text-xs" onClick={onApply}>搜索</Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SearchInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} className="h-8 text-xs" />
    </div>
  )
}

function DateFilter({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: {
  startDate: string
  endDate: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
}) {
  const active = Boolean(startDate || endDate)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-5 border-dashed text-[10px] font-medium shadow-none focus-visible:ring-0", active && "bg-primary/5 border-primary/20")}
        >
          <ReceiptText className="size-3" />
          时间
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[260px] p-4" align="start">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">开始日期</Label>
            <Input type="date" value={startDate} onChange={(event) => onStartChange(event.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">结束日期</Label>
            <Input type="date" value={endDate} onChange={(event) => onEndChange(event.target.value)} className="h-8 text-xs" />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function OrdersTable({
  orders,
  loading,
  onShowDetail,
  onShowDispute,
  onRefund,
}: {
  orders: AdminOrder[]
  loading: boolean
  onShowDetail: (order: AdminOrder) => void
  onShowDispute: (order: AdminOrder) => void
  onRefund: (order: AdminOrder) => void
}) {
  return (
    <div className="border border-dashed shadow-none rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full caption-bottom text-sm min-w-[1200px]">
          <TableHeader className="sticky top-0 z-20 bg-background">
            <TableRow className="border-b border-dashed hover:bg-transparent">
              <TableHead className="w-[150px] whitespace-nowrap">名称</TableHead>
              <TableHead className="text-right whitespace-nowrap w-[80px]">积分</TableHead>
              <TableHead className="text-center whitespace-nowrap w-[80px]">类型</TableHead>
              <TableHead className="text-center whitespace-nowrap w-[80px]">状态</TableHead>
              <TableHead className="text-center whitespace-nowrap w-[100px]">积分动向</TableHead>
              <TableHead className="whitespace-nowrap text-center w-[110px]">应用名</TableHead>
              <TableHead className="whitespace-nowrap w-[150px]">编号</TableHead>
              <TableHead className="whitespace-nowrap w-[130px]">业务单号</TableHead>
              <TableHead className="text-center whitespace-nowrap w-[80px]">结算</TableHead>
              <TableHead className="whitespace-nowrap w-[140px]">创建时间</TableHead>
              <TableHead className="sticky right-0 text-center whitespace-nowrap w-[120px] bg-background shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(order => {
              const typeMeta = ADMIN_TYPE_CONFIG[order.type]
              const statusMeta = ADMIN_STATUS_CONFIG[order.status]
              const isDisputing = order.status === "disputing"
              return (
                <TableRow
                  key={order.id}
                  className={cn(
                    "border-dashed group hover:bg-muted/50",
                    isDisputing && "bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30"
                  )}
                >
                  <TableCell className="text-[11px] font-medium max-w-[150px] truncate" title={order.order_name}>{order.order_name}</TableCell>
                  <TableCell className="text-[11px] font-mono text-right">{displayAmount(order.amount)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={cn("text-[10px] px-1", typeMeta.color)}>{typeMeta.label}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={cn("text-[10px] px-1", statusMeta.color)}>{statusMeta.label}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <OrderFlow order={order} />
                  </TableCell>
                  <TableCell className="text-[11px] font-medium text-center py-1 max-w-[110px] truncate" title={order.app_name || ""}>
                    {order.app_name ? (
                      order.app_homepage_url ? (
                        <Link
                          href={order.app_homepage_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {order.app_name}
                        </Link>
                      ) : (
                        order.app_name
                      )
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-[11px] font-mono">{order.order_no}</TableCell>
                  <TableCell className="text-[11px] font-mono max-w-[130px] truncate" title={order.merchant_order_no || ""}>{order.merchant_order_no || "-"}</TableCell>
                  <TableCell className="text-center text-[11px]">{TRANSFER_STATUS_LABEL[order.payee_transfer_status] || "-"}</TableCell>
                  <TableCell className="text-[11px]">{formatDateTime(order.created_at)}</TableCell>
                  <TableCell
                    className={cn(
                      "sticky right-0 text-center shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]",
                      isDisputing
                        ? "bg-yellow-50 dark:bg-yellow-900/20 group-hover:bg-yellow-100/50 dark:group-hover:bg-yellow-900/30"
                        : "bg-background group-hover:bg-muted/50"
                    )}
                  >
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onShowDetail(order)} title="查看详情">
                      <Eye className="size-3.5" />
                    </Button>
                    {order.dispute_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-1 text-xs rounded-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        onClick={() => onShowDispute(order)}
                        title="查看争议"
                      >
                        <Layers className="size-3" />
                      </Button>
                    )}
                    {isRefundable(order) && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" disabled={loading} onClick={() => onRefund(order)} title="退款">
                        <Undo2 className="size-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function OrderFlow({ order }: { order: AdminOrder }) {
  if (order.status === "pending" || order.status === "expired" || order.type === "community" || order.type === "red_envelope_send" || order.type === "red_envelope_refund") {
    return <div className="text-[11px] text-muted-foreground">-</div>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center cursor-pointer gap-1 justify-center">
            <Avatar className="h-4 w-4">
              <AvatarImage src={order.payer_avatar_url || undefined} />
              <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                {userInitial(order.payer_username)}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs font-bold">⭢</div>
            <Avatar className="h-4 w-4">
              <AvatarImage src={order.payee_avatar_url || undefined} />
              <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                {userInitial(order.payee_username)}
              </AvatarFallback>
            </Avatar>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="px-2.5 py-1.5">
          <div className="space-y-2">
            <div>
              <p className="text-xs font-semibold">消费方</p>
              <p className="text-xs">ID: {order.payer_user_id}</p>
              <p className="text-xs">账户: {order.payer_username || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold">服务方</p>
              <p className="text-xs">ID: {order.payee_user_id}</p>
              <p className="text-xs">账户: {order.payee_username || "-"}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function OrderDetailSheet({ order, onOpenChange }: { order: AdminOrder | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={Boolean(order)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>订单详情</SheetTitle>
          <SheetDescription>{order?.order_no}</SheetDescription>
        </SheetHeader>
        {order && (
          <div className="px-4 pb-4 space-y-4">
            <DetailGroup
              rows={[
                ["订单 ID", order.id],
                ["订单名称", order.order_name],
                ["业务单号", order.merchant_order_no || "-"],
                ["Client ID", order.client_id || "-"],
                ["应用名", order.app_name || "-"],
                ["支付类型", order.payment_type || "-"],
              ]}
            />
            <DetailGroup
              rows={[
                ["积分", displayAmount(order.amount)],
                ["类型", ADMIN_TYPE_CONFIG[order.type].label],
                ["状态", ADMIN_STATUS_CONFIG[order.status].label],
                ["结算状态", TRANSFER_STATUS_LABEL[order.payee_transfer_status] || "-"],
                ["结算时间", order.payee_transfer_at ? formatDateTime(order.payee_transfer_at) : "-"],
              ]}
            />
            <DetailGroup
              rows={[
                ["消费方", `${ order.payer_username || "-" } (${ order.payer_user_id })`],
                ["服务方", `${ order.payee_username || "-" } (${ order.payee_user_id })`],
                ["争议 ID", order.dispute_id || "-"],
                ["争议状态", order.dispute_status || "-"],
              ]}
            />
            <DetailGroup
              rows={[
                ["创建时间", formatDateTime(order.created_at)],
                ["交易时间", order.trade_time ? formatDateTime(order.trade_time) : "-"],
                ["过期时间", formatDateTime(order.expires_at)],
                ["更新时间", formatDateTime(order.updated_at)],
                ["备注", order.remark || "-"],
              ]}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function DetailGroup({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="border border-dashed rounded-lg overflow-hidden">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[96px_1fr] gap-3 px-3 py-2 border-b border-dashed last:border-b-0 text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium break-all">{value}</span>
        </div>
      ))}
    </div>
  )
}

function AdminDisputeDialog({ order, onOpenChange }: { order: AdminOrder | null; onOpenChange: (open: boolean) => void }) {
  const disputeHistory = order?.dispute_id && order.dispute_reason && order.dispute_created_at && order.dispute_updated_at
    ? {
        reason: order.dispute_reason,
        created_at: order.dispute_created_at,
        updated_at: order.dispute_updated_at,
      }
    : null
  const timelineStatus = order?.status === "refused" ? order.status : (order?.dispute_status || order?.status)

  return (
    <Dialog open={Boolean(order)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>争议详情</DialogTitle>
          <DialogDescription>{order ? `订单 ${ order.order_no }` : "查看争议处理记录"}</DialogDescription>
        </DialogHeader>
        {order && (
          <div className="space-y-4">
            <div className="border border-dashed rounded-lg overflow-hidden text-xs">
              <div className="grid grid-cols-[88px_1fr] gap-3 px-3 py-2 border-b border-dashed">
                <span className="text-muted-foreground">争议 ID</span>
                <span className="font-mono">{order.dispute_id || "-"}</span>
              </div>
              <div className="grid grid-cols-[88px_1fr] gap-3 px-3 py-2 border-b border-dashed">
                <span className="text-muted-foreground">争议状态</span>
                <span>{order.dispute_status ? DISPUTE_STATUS_LABEL[order.dispute_status] : "-"}</span>
              </div>
              <div className="grid grid-cols-[88px_1fr] gap-3 px-3 py-2 border-b border-dashed">
                <span className="text-muted-foreground">消费方</span>
                <span>{order.payer_username || "-"}</span>
              </div>
              <div className="grid grid-cols-[88px_1fr] gap-3 px-3 py-2">
                <span className="text-muted-foreground">服务方</span>
                <span>{order.payee_username || "-"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">争议对话</Label>
              {disputeHistory && timelineStatus ? (
                <DisputeHistoryTimeline dispute={disputeHistory} status={timelineStatus} />
              ) : (
                <div className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                  暂无争议内容
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RefundDialog({
  order,
  remark,
  refunding,
  onRemarkChange,
  onOpenChange,
  onConfirm,
}: {
  order: AdminOrder | null
  remark: string
  refunding: boolean
  onRemarkChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const disputeHistory = order?.dispute_id && order.dispute_reason && order.dispute_created_at && order.dispute_updated_at
    ? {
        reason: order.dispute_reason,
        created_at: order.dispute_created_at,
        updated_at: order.dispute_updated_at,
      }
    : null

  return (
    <Dialog open={Boolean(order)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认退款</DialogTitle>
          <DialogDescription>
            退款会退还消费方订单全额，商家手续费不退。该操作提交后不能二次退款。
          </DialogDescription>
        </DialogHeader>
        {order && (
          <div className="space-y-4">
            <div className="border border-dashed rounded-lg overflow-hidden text-xs">
              <div className="grid grid-cols-[88px_1fr] gap-3 px-3 py-2 border-b border-dashed">
                <span className="text-muted-foreground">编号</span>
                <span className="font-mono">{order.order_no}</span>
              </div>
              <div className="grid grid-cols-[88px_1fr] gap-3 px-3 py-2 border-b border-dashed">
                <span className="text-muted-foreground">订单积分</span>
                <span className="font-mono">{displayAmount(order.amount)}</span>
              </div>
              <div className="grid grid-cols-[88px_1fr] gap-3 px-3 py-2">
                <span className="text-muted-foreground">服务方</span>
                <span>{order.payee_username || "-"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">争议记录</Label>
              {disputeHistory ? (
                <DisputeHistoryTimeline dispute={disputeHistory} status={order.status} />
              ) : (
                <div className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                  该订单没有争议记录
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs">管理员备注</Label>
              <Textarea
                value={remark}
                maxLength={100}
                onChange={(event) => onRemarkChange(event.target.value)}
                placeholder="可选，填写后会追加到争议原因或订单备注"
                className="min-h-20 text-xs"
              />
              <div className="text-[10px] text-muted-foreground text-right">{remark.length}/100</div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={refunding}>取消</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={refunding}>
            {refunding ? <Loader2 className="size-3 animate-spin" /> : <RotateCw className="size-3" />}
            确认退款
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
