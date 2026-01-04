import { Suspense } from "react";
import { LoginPage } from "@/components/auth/login-page";

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
