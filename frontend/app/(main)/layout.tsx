"use client"

import { motion } from "motion/react"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { AppSidebar } from "@/components/layout/sidebar"
import { SiteHeader } from "@/components/layout/header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { UserProvider } from "@/contexts/user-context"
import { MerchantProvider } from "@/contexts/merchant-context"


export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isFullWidth, setIsFullWidth] = useState(false)

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
          <SidebarInset className="flex flex-col min-w-0 h-screen">
            <SiteHeader isFullWidth={isFullWidth} onToggleFullWidth={setIsFullWidth} />
            <div className="flex flex-1 flex-col bg-background overflow-y-auto overflow-x-hidden min-w-0 hide-scrollbar">
              <div className={`w-full mx-auto px-12 min-w-0 ${!isFullWidth ? "max-w-[1320px]" : ""}`}>
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  className="w-full"
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
