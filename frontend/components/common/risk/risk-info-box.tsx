import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export interface RiskInfo {
  risk_level: string
  risk_labels: string[]
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
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("text-sm font-medium text-muted-foreground", labelClassName)}>{label}</span>
        <Badge variant="destructive">{riskInfo?.risk_level || "未知"}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {riskInfo?.risk_labels.length ? (
          riskInfo.risk_labels.map(label => (
            <Badge key={label} variant="secondary">
              {label}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">暂无风险标签详情</span>
        )}
      </div>
    </div>
  )
}
