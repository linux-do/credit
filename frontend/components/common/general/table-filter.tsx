import * as React from "react"
import { Filter, CalendarIcon, X, Search, ChevronLeft, ChevronRight, ChevronDown, Loader2 } from "lucide-react"
import { zhCN } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { OrderType, OrderStatus } from "@/lib/services"

/* 类型标签配置 */
export const typeConfig: Record<OrderType, { label: string; color: string }> = {
  receive: { label: '积分收益', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  payment: { label: '积分消耗', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  transfer: { label: '积分转移', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  community: { label: '社区划转', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  online: { label: '在线活动', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300' },
  distribute: { label: '商户分发', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' },
  test: { label: '应用测试', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 font-bold' },
  red_envelope_send: { label: '红包支出', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  red_envelope_receive: { label: '红包收入', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' }
}

/* 状态标签配置 */
export const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  success: { label: '成功', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  pending: { label: '处理中', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  failed: { label: '失败', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  expired: { label: '已过期', color: 'bg-muted/50 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
  disputing: { label: '争议中', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  refund: { label: '已退回', color: 'bg-muted/50 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
  refused: { label: '已拒绝', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
}

/* 时间范围选项 */
export const timeRangeOptions = [
  {
    label: "今天", getValue: () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return { from: today, to: tomorrow }
    }
  },
  {
    label: "最近 7 天", getValue: () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const from = new Date(today)
      from.setDate(from.getDate() - 6)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return { from, to: tomorrow }
    }
  },
  {
    label: "最近 1 个月", getValue: () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const from = new Date(today)
      from.setDate(from.getDate() - 29)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return { from, to: tomorrow }
    }
  },
  {
    label: "最近 6 个月", getValue: () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const from = new Date(today)
      from.setMonth(from.getMonth() - 6)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return { from, to: tomorrow }
    }
  },
  {
    label: "本月至今", getValue: () => {
      const today = new Date()
      const from = new Date(today.getFullYear(), today.getMonth(), 1)
      from.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setHours(0, 0, 0, 0)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return { from, to: tomorrow }
    }
  },
  {
    label: "本季至今", getValue: () => {
      const today = new Date()
      const quarter = Math.floor(today.getMonth() / 3)
      const from = new Date(today.getFullYear(), quarter * 3, 1)  // 本季第一天 00:00:00
      from.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setHours(0, 0, 0, 0)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return { from, to: tomorrow }
    }
  },
  { label: "所有时间", getValue: () => null },
]

export interface TableFilterProps {
  /* 启用的筛选类型 */
  enabledFilters?: {
    type?: boolean
    status?: boolean
    timeRange?: boolean
    search?: boolean
  }

  /* 当前选中的值 */
  selectedTypes?: OrderType[]
  selectedStatuses?: OrderStatus[]
  selectedTimeRange?: { from: Date; to: Date } | null
  selectedQuickSelection?: string | null
  /* 搜索值 */
  searchValues?: SearchValues

  /* 回调函数 */
  onTypeChange?: (types: OrderType[]) => void
  onStatusChange?: (statuses: OrderStatus[]) => void
  onTimeRangeChange?: (range: { from: Date; to: Date } | null) => void
  onQuickSelectionChange?: (selection: string | null) => void
  onSearch?: (values: SearchValues) => void

  // 其他选项
  showClearButton?: boolean
  onClearAll?: () => void

  // 分页控制（可选）
  enablePagination?: boolean
  currentPage?: number
  totalPages?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onRefresh?: () => void
  loading?: boolean
}

/**
 * 可复用的筛选组件
 * 支持类型、状态、时间范围筛选
 */
export function TableFilter({
  enabledFilters = { type: true, status: true, timeRange: true, search: true },
  selectedTypes = [],
  selectedStatuses = [],
  selectedTimeRange = null,
  selectedQuickSelection = null,
  searchValues = {},
  onTypeChange,
  onStatusChange,
  onTimeRangeChange,
  onQuickSelectionChange,
  onSearch,
  showClearButton = true,
  onClearAll,
  enablePagination = false,
  currentPage = 1,
  totalPages = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  loading = false,
}: TableFilterProps) {
  /* 通用切换筛选函数 */
  const handleToggle = <T extends string>(
    value: T,
    selectedValues: T[],
    onChange?: (values: T[]) => void
  ) => {
    if (!onChange) return
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value]
    onChange(newValues)
  }

  /* 切换类型筛选 */
  const toggleType = (type: OrderType) => handleToggle(type, selectedTypes, onTypeChange)

  /* 切换状态筛选 */
  const toggleStatus = (status: OrderStatus) => handleToggle(status, selectedStatuses, onStatusChange)

  /* 处理时间范围变化 */
  const handleTimeRangeChange = (range: { from: Date; to: Date } | null) => {
    onTimeRangeChange?.(range)
  }

  /* 是否有激活的筛选 */
  const hasActiveFilters = selectedTypes.length > 0 || selectedStatuses.length > 0 || selectedTimeRange !== null || Object.values(searchValues).some(v => v)

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        {enabledFilters.search && (
          <SearchFilter
            values={searchValues}
            onSearch={onSearch}
          />
        )}

        {enabledFilters.type && (
          <FilterSelect<OrderType>
            label="类型"
            selectedValues={selectedTypes}
            options={typeConfig}
            onToggleValue={toggleType}
          />
        )}

        {enabledFilters.status && (
          <FilterSelect<OrderStatus>
            label="状态"
            selectedValues={selectedStatuses}
            options={statusConfig}
            onToggleValue={toggleStatus}
          />
        )}

        {enabledFilters.timeRange && (
          <TimeRangeFilter
            selectedQuickSelection={selectedQuickSelection}
            selectedTimeRange={selectedTimeRange}
            onTimeRangeChange={handleTimeRangeChange}
            onQuickSelectionChange={onQuickSelectionChange}
          />
        )}

        {showClearButton && hasActiveFilters && onClearAll && (
          <>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-5 px-2 lg:px-3 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
              清空筛选
            </Button>
          </>
        )}
      </div>

      {enablePagination && onPageChange && onPageSizeChange && (
        <Separator className="lg:hidden" />
      )}

      {enablePagination && onPageChange && onPageSizeChange && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onRefresh={onRefresh}
          loading={loading}
        />
      )}
    </div>
  )
}


interface TablePaginationProps {
  currentPage: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRefresh?: () => void
  loading?: boolean
}

export function TablePagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  loading = false
}: TablePaginationProps) {
  return (
    <div className="flex items-center gap-2 self-end lg:self-auto">
      <span className="text-[10px] text-muted-foreground whitespace-nowrap hidden sm:inline-block">
        {total} 条记录
      </span>
      <div className="flex items-center border border-dashed rounded-md shadow-none bg-background">
        <Button
          variant="ghost"
          size="icon"
          className="h-5.5 w-6 rounded-none rounded-l-md disabled:opacity-30"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1 || loading}
        >
          <ChevronLeft className="size-3" />
        </Button>
        <span className="text-[10px] font-mono text-muted-foreground px-2 border-x border-dashed h-5.5 flex items-center">
          {currentPage}/{totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5.5 w-6 rounded-none rounded-r-md disabled:opacity-30"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages || loading}
        >
          <ChevronRight className="size-3" />
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 border-dashed text-[10px] px-2 font-mono shadow-none" disabled={loading}>
            {pageSize}条/页
            <ChevronDown className="size-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {[20, 50, 100].map(size => (
            <DropdownMenuItem
              key={size}
              onClick={() => onPageSizeChange(size)}
              className={cn("font-mono text-xs", pageSize === size && "bg-accent")}
            >
              {size}条/页
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {onRefresh && (
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6 border-dashed shadow-none"
          onClick={onRefresh}
          disabled={loading}
          title="刷新数据"
        >
          <Loader2 className={cn("size-3", loading && "animate-spin")} />
        </Button>
      )}
    </div>
  )
}

/**
 * 可复用的筛选选择器组件
 */
export function FilterSelect<T extends string>({ label, selectedValues, options, onToggleValue }: {
  label: string
  selectedValues: T[]
  options: Record<T, { label: string; color: string }>
  onToggleValue: (value: T) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-5 border-dashed text-[10px] font-medium shadow-none focus-visible:ring-0",
            selectedValues.length > 0 && "bg-primary/5 border-primary/20"
          )}
        >
          <Filter className="size-3" />
          {label}
          {selectedValues.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-1" />
              <Badge
                variant="secondary"
                className="text-[10px] h-3 px-1 rounded-full bg-primary text-primary-foreground"
              >
                {selectedValues.length}
              </Badge>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[120px]" align="start">
        {(Object.keys(options) as T[]).map((value) => {
          const isSelected = selectedValues.includes(value)
          return (
            <DropdownMenuItem
              key={value}
              onSelect={(e) => {
                e.preventDefault()
                onToggleValue(value)
              }}
            >
              <div className={cn(
                "mr-2 flex size-3 items-center justify-center rounded-sm border border-primary",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "opacity-50 [&_svg]:invisible"
              )}>
              </div>
              <span className="text-xs">{options[value].label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface TimeRangeFilterProps {
  selectedQuickSelection: string | null
  selectedTimeRange: { from: Date; to: Date } | null
  onTimeRangeChange: (range: { from: Date; to: Date } | null) => void
  onQuickSelectionChange?: (selection: string | null) => void
}

function TimeRangeFilter({
  selectedQuickSelection,
  selectedTimeRange,
  onTimeRangeChange,
  onQuickSelectionChange
}: TimeRangeFilterProps) {
  /* 处理日历选择 */
  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from) {
      const from = new Date(range.from)
      from.setHours(0, 0, 0, 0)

      if (range.to) {
        const to = new Date(range.to)
        to.setHours(0, 0, 0, 0)
        onTimeRangeChange({ from, to })
        onQuickSelectionChange?.(null)
      } else if (range.from.getTime() === selectedTimeRange?.from?.getTime()) {
        const to = new Date(from)
        to.setHours(0, 0, 0, 0)
        onTimeRangeChange({ from, to })
        onQuickSelectionChange?.(null)
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-5 border-dashed text-[10px] font-medium shadow-none focus-visible:ring-0",
            (selectedQuickSelection || selectedTimeRange) && "bg-primary/5 border-primary/20"
          )}
        >
          <CalendarIcon className="mr-1 size-3" />
          {selectedQuickSelection || (selectedTimeRange ? "自定义时间" : "时间范围")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto p-0" align="start">
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-col p-2 gap-1 min-w-[120px] border-r">
            {timeRangeOptions.map((selection) => (
              <Button
                key={selection.label}
                variant="ghost"
                size="sm"
                onClick={() => {
                  const range = selection.getValue()
                  onTimeRangeChange(range)
                  onQuickSelectionChange?.(selection.label)
                }}
                className={cn(
                  "justify-start text-xs font-normal h-8",
                  selectedQuickSelection === selection.label && "bg-accent text-accent-foreground font-medium"
                )}
              >
                {selection.label}
              </Button>
            ))}
          </div>
          <div className="p-2">
            <Calendar
              mode="range"
              selected={selectedTimeRange ? { from: selectedTimeRange.from, to: selectedTimeRange.to } : undefined}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              locale={zhCN}
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export interface SearchValues {
  id?: string
  order_name?: string
  payer_username?: string
  payee_username?: string
}

export function SearchFilter({
  values,
  onSearch
}: {
  values?: SearchValues
  onSearch?: (values: SearchValues) => void
}) {
  const [localValues, setLocalValues] = React.useState<SearchValues>(values || {})
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setLocalValues(values || {})
  }, [values, isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSearch?.(localValues)
      setIsOpen(false)
    }
  }

  const handleSearch = () => {
    onSearch?.(localValues)
    setIsOpen(false)
  }

  const handleClear = () => {
    const empty = { id: '', order_name: '', payer_username: '', payee_username: '' }
    setLocalValues(empty)
    onSearch?.(empty)
    setIsOpen(false)
  }

  const hasSearchValues = Object.values(values || {}).some(v => v)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-5 border-dashed text-[10px] font-medium shadow-none focus-visible:ring-0",
            hasSearchValues && "bg-primary/5 border-primary/20"
          )}
        >
          <Search className="size-3" />
          搜索
          {hasSearchValues && (
            <>
              <Separator orientation="vertical" className="mx-1 h-3" />
              <Badge
                variant="secondary"
                className="text-[10px] h-3 px-1 rounded-full bg-primary text-primary-foreground"
              >
                !
              </Badge>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[280px] p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">编号 ID</Label>
            <Input
              value={localValues.id || ''}
              onChange={e => setLocalValues(prev => ({ ...prev, id: e.target.value }))}
              onKeyDown={handleKeyDown}
              placeholder="精确匹配"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">活动名称</Label>
            <Input
              value={localValues.order_name || ''}
              onChange={e => setLocalValues(prev => ({ ...prev, order_name: e.target.value }))}
              onKeyDown={handleKeyDown}
              placeholder="模糊匹配"
              className="h-8 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-xs">消费方</Label>
              <Input
                value={localValues.payer_username || ''}
                onChange={e => setLocalValues(prev => ({ ...prev, payer_username: e.target.value }))}
                onKeyDown={handleKeyDown}
                placeholder="模糊匹配"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">服务方</Label>
              <Input
                value={localValues.payee_username || ''}
                onChange={e => setLocalValues(prev => ({ ...prev, payee_username: e.target.value }))}
                onKeyDown={handleKeyDown}
                placeholder="模糊匹配"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={handleClear}>
              重置
            </Button>
            <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleSearch}>
              搜索
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
