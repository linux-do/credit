import { toast } from "sonner"
import { RiskInfo, RiskInfoBox } from "@/components/common/risk/risk-info-box"

const RISK_TOAST_ID = "credit-risk-warning"

export function showRiskWarningToast(riskInfo: RiskInfo) {
  toast.custom(
    () => (
      <div className="w-[min(calc(100vw-2rem),28rem)]">
        <RiskInfoBox riskInfo={riskInfo} label="账号存在风险提示" labelClassName="font-semibold text-foreground" />
      </div>
    ),
    {
      id: RISK_TOAST_ID,
      duration: Infinity,
      closeButton: true,
      dismissible: true,
    },
  )
}
