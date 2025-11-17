import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Filter, CalendarIcon, X } from "lucide-react"

import { zhCN } from "date-fns/locale"
import type { OrderType, OrderStatus } from "@/lib/services"


/* 类型标签配置 */
export const typeConfig: Record<OrderType, { label: string; color: string }> = {
  receive: { label: '收款', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  payment: { label: '付款', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  transfer: { label: '转账', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  community: { label: '社区划转', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' }
}

/* 状态标签配置 */
export const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  success: { label: '成功', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  pending: { label: '处理中', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  failed: { label: '失败', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  expired: { label: '已过期', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
  disputing: { label: '争议中', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  refund: { label: '已退款', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
  refunding: { label: '退款中', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' }
}

/* 时间范围选项 */
export const timeRangeOptions = [
  { label: "今天", getValue: () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    tomorrow.setMilliseconds(-1)
    return { from: today, to: tomorrow }
  }},
  { label: "最近 7 天", getValue: () => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 7)
    return { from, to }
  }},
  { label: "最近 1 个月", getValue: () => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 30)
    return { from, to }
  }},
  { label: "最近 6 个月", getValue: () => {
    const to = new Date()
    const from = new Date()
    from.setMonth(from.getMonth() - 6)
    return { from, to }
  }},
  { label: "本月至今", getValue: () => {
    const to = new Date()
    const from = new Date(to.getFullYear(), to.getMonth(), 1)
    return { from, to }
  }},
  { label: "本季至今", getValue: () => {
    const to = new Date()
    const quarter = Math.floor(to.getMonth() / 3)
    const from = new Date(to.getFullYear(), quarter * 3, 1)
    return { from, to }
  }},
  { label: "所有时间", getValue: () => null },
]


/**
 * 表格筛选组件的属性
 * @example
 * ```tsx
 * <TableFilter
 *   enabledFilters={{ type: true, status: true, timeRange: true }}
 *   selectedTypes={["receive", "payment"]}
 *   selectedStatuses={["success", "failed"]}
 *   selectedTimeRange={{ from: new Date(), to: new Date() }}
 *   selectedQuickSelection="最近 7 天"
 * />
 * ```
 */
export interface TableFilterProps {
  /* 启用的筛选类型 */
  enabledFilters?: {
    type?: boolean
    status?: boolean
    timeRange?: boolean
  }

  /* 当前选中的值 */
  selectedTypes?: OrderType[]
  selectedStatuses?: OrderStatus[]
  selectedTimeRange?: { from: Date; to: Date } | null
  selectedQuickSelection?: string | null

  /* 回调函数 */
  onTypeChange?: (types: OrderType[]) => void
  onStatusChange?: (statuses: OrderStatus[]) => void
  onTimeRangeChange?: (range: { from: Date; to: Date } | null) => void
  onQuickSelectionChange?: (selection: string | null) => void

  // 其他选项
  showClearButton?: boolean
  onClearAll?: () => void
}

/**
 * 可复用的筛选组件
 * 支持类型、状态、时间范围筛选
 * 
 * @example
 * ```tsx
 * <TableFilter
 *   enabledFilters={{ type: true, status: true, timeRange: true }}
 *   selectedTypes={["receive", "payment"]}
 *   selectedStatuses={["success", "failed"]}
 *   selectedTimeRange={{ from: new Date(), to: new Date() }}
 *   selectedQuickSelection="最近 7 天"
 *   onTypeChange={setSelectedTypes}
 *   onStatusChange={setSelectedStatuses}
 *   onTimeRangeChange={setDateRange}
 *   onQuickSelectionChange={setSelectedQuickSelection}
 *   showClearButton={true}
 *   onClearAll={clearAllFilters}
 * />
 * ```
 */
export function TableFilter({
  enabledFilters = { type: true, status: true, timeRange: true },
  selectedTypes = [],
  selectedStatuses = [],
  selectedTimeRange = null,
  selectedQuickSelection = null,
  onTypeChange,
  onStatusChange,
  onTimeRangeChange,
  onQuickSelectionChange,
  showClearButton = true,
  onClearAll,
}: TableFilterProps) {
  /* 切换类型筛选 */
  const toggleType = (type: OrderType) => {
    if (!onTypeChange) return
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type]
    onTypeChange(newTypes)
  }

  /* 切换状态筛选 */
  const toggleStatus = (status: OrderStatus) => {
    if (!onStatusChange) return
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status]
    onStatusChange(newStatuses)
  }

  /* 处理时间范围变化 */
  const handleTimeRangeChange = (range: { from: Date; to: Date } | null) => {
    onTimeRangeChange?.(range)
  }

  /* 处理日历选择 */
  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from) {
      let to = range.to || range.from
      if (!range.to || range.from.getTime() === to.getTime()) {
        to = new Date(range.from)
        to.setHours(23, 59, 59, 999)
      }
      handleTimeRangeChange({ from: range.from, to })
      onQuickSelectionChange?.(null)
    }
  }

  /* 是否有激活的筛选 */
  const hasActiveFilters = selectedTypes.length > 0 || selectedStatuses.length > 0

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="flex items-center gap-2 flex-wrap">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="!h-6 !min-h-6 text-xs font-bold rounded-full border border-dashed shadow-none !px-2.5 !py-1 gap-2 inline-flex items-center w-auto hover:bg-accent">
                <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground text-xs font-bold">时间区间</span>
                {selectedQuickSelection && (
                  <>
                    <Separator orientation="vertical" className="h-2.5" />
                    <span className="text-blue-600 text-xs font-bold">{selectedQuickSelection}</span>
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-90 md:w-160" align="start" sideOffset={4}>
              <div className="flex">
                <div className="w-32 px-1 py-4">
                  {timeRangeOptions.map((selection) => (
                    <button
                      key={selection.label}
                      onClick={() => {
                        const range = selection.getValue()
                        handleTimeRangeChange(range)
                        onQuickSelectionChange?.(selection.label)
                      }}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors cursor-pointer ${
                        selectedQuickSelection === selection.label ? 'bg-accent text-accent-foreground' : ''
                      }`}
                    >
                      {selection.label}
                    </button>
                  ))}
                </div>

                <div className="px-1">
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
        )}
      </div>

      {showClearButton && hasActiveFilters && onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2.5 text-xs font-bold rounded-full border border-dashed text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 gap-1 self-start sm:self-auto"
        >
          <X className="h-3 w-3" />
          清空筛选
        </Button>
      )}
    </div>
  )
}

/**
 * 可复用的筛选选择器组件
 * 支持类型、状态、时间范围筛选
 * 
 * @example
 * ```tsx
 * <FilterSelect
 *   label="类型"
 *   selectedValues={["receive", "payment"]}
 *   options={typeConfig}
 *   onToggleValue={toggleType}
 * />
 * ```
 */
function FilterSelect<T extends string>({ label, selectedValues, options, onToggleValue }: {
  label: string
  selectedValues: T[]
  options: Record<T, { label: string; color: string }>
  onToggleValue: (value: T) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`!h-6 !min-h-6 text-xs font-bold rounded-full border border-dashed shadow-none !px-2.5 !py-1 gap-2 inline-flex items-center w-auto hover:bg-accent ${
          selectedValues.length > 0
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-muted-foreground/20'
        }`}>
          <Filter className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground text-xs font-bold">{label}</span>
          {selectedValues.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-2.5" />
              <span className="text-blue-600 text-xs font-bold">{selectedValues.length}</span>
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-36" align="start">
        {(Object.keys(options) as T[]).map((value) => (
          <DropdownMenuItem
            key={value}
            className="flex items-center gap-2 px-2"
            onClick={() => onToggleValue(value)}
          >
            <Checkbox
              checked={selectedValues.includes(value)}
              onChange={() => onToggleValue(value)}
              className="w-3 h-3 rounded-full"
            />
            <Badge
              variant="secondary"
              className={`text-[11px] px-1 ${options[value].color}`}
            >
              {options[value].label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
