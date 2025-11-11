"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Settings, Plus, CalendarIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { zhCN } from "date-fns/locale"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface OverviewToolProps {
  onDateRangeChange?: (dateRange: { from: Date; to: Date }) => void
}

export function OverviewTool({ onDateRangeChange }: OverviewToolProps) {
  const getLastDays = (days: number) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    return { from, to }
  }
  
  // 跟踪当前选择的预设时间范围
  const [selectedQuickSelection, setSelectedQuickSelection] = React.useState<string | null>("最近 7 天")
  
  const [dateRange, setDateRange] = React.useState<{
    from: Date
    to: Date
  }>(getLastDays(7))
  
  // 当日期范围改变时通知父组件
  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range)
    onDateRangeChange?.(range)
  }

  const quickSelections = [
    { label: "今天", getValue: () => {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      tomorrow.setMilliseconds(-1) // 设置为当天的最后一毫秒
      return { from: today, to: tomorrow }
    }},
    { label: "最近 7 天", getValue: () => getLastDays(7) },
    { label: "最近 4 周", getValue: () => getLastDays(28) },
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
    { label: "所有时间", getValue: () => {
      const to = new Date()
      const from = new Date(2020, 0, 1) // 从2020年开始
      return { from, to }
    }},
  ]

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="!h-6 !min-h-6 text-xs font-bold rounded-full border border-muted-foreground/20 shadow-none !px-2.5 !py-1 gap-2 inline-flex items-center w-auto hover:bg-accent">
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
                {quickSelections.map((selection) => (
                  <button
                    key={selection.label}
                    onClick={() => {
                      const range = selection.getValue()
                      handleDateRangeChange(range)
                      setSelectedQuickSelection(selection.label)
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
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from) {
                      let to = range.to || range.from
                      if (!range.to || range.from.getTime() === to.getTime()) {
                        to = new Date(range.from)
                        to.setHours(23, 59, 59, 999)
                      }
                      handleDateRangeChange({ from: range.from, to })
                      setSelectedQuickSelection(null)
                    }
                  }}
                  numberOfMonths={2}
                  locale={zhCN}
                />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-7 w-7 rounded-full border-muted-foreground/20">
          <Plus className="h-3 w-3" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7 rounded-full border-muted-foreground/20">
          <Settings className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

