"use client"

import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Bell, Plus, Settings, Search, Moon, Sun, Maximize2, Minimize2 } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { SearchDialog } from "@/components/layout/search-dialog"


/**
 * 站点头部组件
 * 用于显示站点头部
 * 
 * @example
 * ```tsx
 * <SiteHeader />
 * ```
 */
export function SiteHeader({ isFullWidth = false, onToggleFullWidth }: { isFullWidth?: boolean, onToggleFullWidth?: (value: boolean) => void }) {
  const { user } = useUser()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex flex-col w-full">
      <AppBanner />
      <header className="flex h-(--header-height) shrink-0 items-center bg-background px-4 md:px-0">
        <div className="flex w-full items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <span className="text-sm font-medium truncate max-w-[120px]">
              {user?.nickname || user?.username || "Guest"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" onClick={() => setSearchOpen(true)}>
              <Search className="size-[18px]" />
              <span className="sr-only">搜索</span>
            </Button>
            <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground">
              <Bell className="size-[18px]" />
              <span className="sr-only">通知</span>
            </Button>
            <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" onClick={() => router.push('/settings')}>
              <Settings className="size-[18px]" />
              <span className="sr-only">设置</span>
            </Button>
          </div>
        </div>

        <div className={`hidden md:flex w-full items-center gap-4 ${!isFullWidth ? "max-w-[1320px]" : ""} mx-auto px-12`}>
          <div className="relative w-64 cursor-pointer" onClick={() => setSearchOpen(true)}>
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <div className="h-8 border-none bg-muted/100 pl-10 pr-3 text-sm rounded-md flex items-center text-muted-foreground">
              <span>搜索</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground">
              <Bell className="size-[18px]" />
              <span className="sr-only">通知</span>
            </Button>
            <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" onClick={() => router.push('/settings')}>
              <Settings className="size-[18px]" />
              <span className="sr-only">设置</span>
            </Button>
            <Button className="mx-1 size-7 rounded-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => router.push('/merchant')}>
              <Plus className="size-4" />
              <span className="sr-only">新建</span>
            </Button>

            <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" onClick={() => onToggleFullWidth?.(!isFullWidth)}>
              {isFullWidth ? <Minimize2 className="size-[18px]" /> : <Maximize2 className="size-[18px]" />}
              <span className="sr-only">切换全宽</span>
            </Button>

            <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {mounted ? (theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />) : <Moon className="size-[18px]" />}
              <span className="sr-only">主题切换</span>
            </Button>
          </div>
        </div>

        {mounted && <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />}
      </header>
    </div>
  )
}

function AppBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const bannerKey = 'ldc-banner-dismissed-script'

  useEffect(() => {
    const dismissed = localStorage.getItem(bannerKey)
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(bannerKey, 'true')
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative flex w-full items-center justify-center bg-muted/50 overflow-hidden"
        >
          <div className="flex w-full items-center justify-center px-4 py-2 text-xs md:text-[13px] font-medium text-muted-foreground">
            <p>
              <span className="text-foreground">「LINUX DO Credit」实时积分收入脚本已发布</span>
              <a href="https://linux.do/t/topic/1365853" target="_blank" className="ml-2 underline underline-offset-4 hover:text-foreground">
                查看详情
              </a>
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 size-6 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
            >
              <span className="sr-only">Dismiss</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-x"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
