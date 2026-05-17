import { toast } from "sonner"
import { X } from "lucide-react"
import { RiskInfo, RiskInfoBox } from "@/components/common/risk/risk-info-box"

const RISK_TOAST_ID = "credit-risk-warning"
let isRiskWarningDismissed = false

function dismissRiskWarningToast(id: string | number) {
  isRiskWarningDismissed = true
  toast.dismiss(id)
}

export function showRiskWarningToast(riskInfo: RiskInfo) {
  if (isRiskWarningDismissed) return

  toast.custom(
    (id) => (
      <div className="relative w-[min(calc(100vw-2rem),28rem)]">
        <button
          type="button"
          aria-label="关闭风险提示"
          className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => dismissRiskWarningToast(id)}
        >
          <X className="size-4" />
        </button>
        <RiskInfoBox riskInfo={riskInfo} label="账号存在风险提示" labelClassName="font-semibold text-foreground" />
      </div>
    ),
    {
      id: RISK_TOAST_ID,
      duration: Infinity,
      dismissible: true,
      onDismiss: () => {
        isRiskWarningDismissed = true
      },
    },
  )
}
