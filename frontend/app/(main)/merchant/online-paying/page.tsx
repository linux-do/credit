import { Suspense } from "react"
import { Spinner } from "@/components/ui/spinner"
import { MerchantOnline } from "@/components/common/merchant/merchant-online"

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><Spinner /></div>}>
      <MerchantOnline />
    </Suspense>
  )
}
