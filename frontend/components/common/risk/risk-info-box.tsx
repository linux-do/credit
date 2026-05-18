import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export interface RiskItem {
  label: string
  value?: string
  desc?: string
}

export interface RiskInfo {
  risk_level: string
  risk_labels: string[]
  risks: RiskItem[]
}

export function RiskInfoBox({
  riskInfo,
  label = "风险等级",
  labelClassName,
}: {
  riskInfo: RiskInfo | null
  label?: string
  labelClassName?: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("text-sm font-medium text-muted-foreground", labelClassName)}>{label}</span>
        <Badge variant="destructive">{riskInfo?.risk_level || "未知"}</Badge>
      </div>

      <div className="mt-4 space-y-2">
        {riskInfo?.risks.length ? (
          riskInfo.risks.map(risk => (
            <div key={risk.value || risk.label} className="rounded-md border bg-muted/35 px-3 py-2.5">
              <span className="text-sm font-medium leading-5 text-foreground">{risk.label}</span>
              {risk.desc ? (
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{risk.desc}</p>
              ) : null}
            </div>
          ))
        ) : riskInfo?.risk_labels.length ? (
          <div className="flex flex-wrap gap-2">
            {riskInfo.risk_labels.map(label => (
              <Badge key={label} variant="secondary">
                {label}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">暂无风险标签详情</span>
        )}
      </div>
    </div>
  )
}
