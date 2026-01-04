"use client";

import { MerchantProvider } from "@/contexts/merchant-context";
import { UserProvider } from "@/contexts/user-context";

/**
 * 积分服务页面布局
 * 为积分服务相关的页面提供社区用户和开发者上下文
 */
export default function PayLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <MerchantProvider>{children}</MerchantProvider>
    </UserProvider>
  );
}
