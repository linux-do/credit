"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { RiskInfo, RiskInfoBox } from "@/components/common/risk/risk-info-box"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const RISK_BLOCKED_EVENT = "credit-risk-blocked"

function isRiskInfo(value: unknown): value is RiskInfo {
  if (!value || typeof value !== "object") return false
  const riskInfo = value as Partial<RiskInfo>
  return typeof riskInfo.risk_level === "string" && Array.isArray(riskInfo.risk_labels)
}

export function RiskBlockDialog() {
  const [riskInfo, setRiskInfo] = useState<RiskInfo | null>(null)

  useEffect(() => {
    const handleRiskBlocked = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail
      if (!isRiskInfo(detail)) return
      setRiskInfo(detail)
    }

    window.addEventListener(RISK_BLOCKED_EVENT, handleRiskBlocked)
    return () => window.removeEventListener(RISK_BLOCKED_EVENT, handleRiskBlocked)
  }, [])

  return (
    <Dialog open={!!riskInfo}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className="sm:max-w-md"
      >
        <DialogHeader className="items-center text-center sm:text-center">
          <div className="mb-1 flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <DialogTitle className="text-center text-lg">账号存在风险</DialogTitle>
          <DialogDescription className="text-center text-sm leading-6">
            因触发风控，账号暂时无法使用需登录的功能
          </DialogDescription>
        </DialogHeader>

        <RiskInfoBox riskInfo={riskInfo} />
      </DialogContent>
    </Dialog>
  )
}
