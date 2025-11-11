"use client"

import * as React from "react"

export function Payment() {
  return (
    <div className="space-y-4 mt-2 mb-6">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-6 py-4">
        <div className="max-w-2xl">
          <h2 className="font-semibold mb-3">付款功能</h2>
          <div className="text-muted-foreground space-y-2">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>安全的付款流程，确保您的资金安全。</li>
              <li>实时付款状态跟踪，随时了解交易进展。</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
