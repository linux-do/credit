import { Suspense } from "react";
import { MerchantOnline } from "@/components/common/merchant/merchant-online";

export default function Page() {
  return (
    <Suspense>
      <MerchantOnline />
    </Suspense>
  );
}
