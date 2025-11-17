"use client"

import { motion } from "motion/react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { UserProvider } from "@/contexts/user-context"
import { MerchantProvider } from "@/contexts/merchant-context"


export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <UserProvider>
      <MerchantProvider>
        <SidebarProvider
          className="h-screen"
          style={
            {
              "--header-height": "60px",
            } as React.CSSProperties
          }
        >
          <AppSidebar />
          <SidebarInset className="flex flex-col min-w-0">
            <SiteHeader />
            <div className="flex flex-1 flex-col bg-background overflow-y-auto overflow-x-hidden min-w-0">
              <div className="w-full max-w-[1320px] mx-auto px-12 min-w-0">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.3,
                    ease: "easeOut",
                  }}
                >
                  {children}
                </motion.div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </MerchantProvider>
    </UserProvider>
  )
}
