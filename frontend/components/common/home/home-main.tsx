"use client"

import * as React from "react"

import { DataPanel } from "@/components/common/home/data-panel"
import { OverviewTool } from "@/components/common/home/overview-tool"
import { OverviewPanel } from "@/components/common/home/overview-panel"

export function HomeMain() {
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date } | null>(null)

  return (
    <div className="py-6 space-y-12">
      <div>
        <h1 className="pb-2 text-2xl font-semibold border-b border-border mb-6">今天</h1>
        <DataPanel />
      </div>

      <div>
        <h1 className="pb-2 text-2xl font-semibold border-b border-border">您的概览</h1>
        <OverviewTool onDateRangeChange={setDateRange}/>
        <OverviewPanel dateRange={dateRange}/>
      </div>

    </div>
  )
}
