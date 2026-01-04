import { Suspense } from "react";
import { PayingOnline } from "@/components/common/pay/paying/paying-online";

export default function Page() {
  return (
    <Suspense>
      <PayingOnline />
    </Suspense>
  );
}
