"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { AnimateIcon } from "@/components/animate-ui/icons/icon"
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left"
import { ChevronRight } from "@/components/animate-ui/icons/chevron-right"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { getCurrentTheme } from "@/components/layout/avater-style/registry"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Home,
  CreditCard,
  Settings,
  Wallet,
  FileText,
  CircleDollarSign,
  LogOut,
  Store,
  ChevronDown,
  UserRound,
  FileQuestionMark,
  ShieldCheck,
  Globe,
  Layers,
} from "lucide-react"

import { useUser } from "@/contexts/user-context"


/* 导航数据 */
const data = {
  navMain: [
    { title: "首页", url: "/home", icon: Home },
    { title: "集市", url: "/merchant", icon: Store },
    { title: "积分", url: "/balance", icon: Wallet },
    { title: "活动", url: "/trade", icon: CircleDollarSign },
  ],
  admin: [
    { title: "系统配置", url: "/admin/system", icon: ShieldCheck },
    { title: "积分配置", url: "/admin/credit", icon: Settings },
    { title: "用户管理", url: "/admin/users", icon: UserRound },
    { title: "任务管理", url: "/admin/tasks", icon: Layers },
  ],
  document: [
    { title: "接口文档", url: "/docs/api", icon: CreditCard },
    { title: "使用文档", url: "/docs/how-to-use", icon: FileText },
  ],
  products: [
    { title: "在线流转", url: "/merchant/online-paying", icon: Globe },
  ],
}

/**
 * 应用侧边栏组件
 * 显示应用侧边栏
 * 
 * @example
 * ```tsx
 * <AppSidebar />
 * ```
 * @returns {React.ReactNode} 应用侧边栏组件
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { toggleSidebar, state, isMobile, setOpenMobile } = useSidebar()
  const { user, getTrustLevelLabel, logout } = useUser()
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const currentTheme = getCurrentTheme()
  const {
    MainDecoration,
    InteractionDecoration,
    BackgroundEffect,
    smallMainDecorationConfig,
    largeMainDecorationConfig,
    interactionDecorationConfig
  } = currentTheme

  const [showEffect, setShowEffect] = React.useState(false)
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)
  const userMenuLastToggle = React.useRef(0)

  const handleUserMenuOpenChange = React.useCallback((open: boolean) => {
    const now = Date.now()
    if (now - userMenuLastToggle.current < 65) return
    userMenuLastToggle.current = now
    setUserMenuOpen(open)
  }, [])

  const handleCloseSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [isMobile, setOpenMobile])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      setShowLogoutDialog(false)
    } catch (error) {
      toast.error("登出失败", {
        description: error instanceof Error ? error.message : "登出时发生错误，请重试"
      })
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      {showEffect && BackgroundEffect && <BackgroundEffect />}
      <Sidebar collapsible="icon" {...props} className="px-2 relative border-r border-border/40 group-data-[collapsible=icon]">
        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="icon"
          className="absolute top-1/2 -right-6 w-2 h-4 text-muted-foreground hover:bg-background hidden md:flex"
        >
          {state === "expanded" ? (
            <AnimateIcon animateOnHover>
              <ChevronLeft className="size-6" />
            </AnimateIcon>
          ) : (
            <AnimateIcon animateOnHover>
              <ChevronRight className="size-6" />
            </AnimateIcon>
          )}
        </Button>

        <SidebarHeader className="py-4 md:-ml-2">
          <DropdownMenu open={userMenuOpen} onOpenChange={handleUserMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-12 hover:bg-accent group-data-[collapsible=icon]:ml-2"
                suppressHydrationWarning
              >
                <div className="relative overflow-visible">
                  <MainDecoration className={smallMainDecorationConfig?.className} />
                  <Avatar className="size-6 rounded relative z-10">
                    <AvatarImage
                      src={user?.avatar_url}
                      alt={user?.nickname}
                    />
                    <AvatarFallback className="rounded bg-muted text-sm">
                      {user?.nickname?.charAt(0)?.toUpperCase() || "L"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col items-start flex-1 text-left group-data-[collapsible=icon]:hidden">
                  <span className="text-xs font-medium truncate w-full text-left ml-2">
                    {user?.nickname || user?.username || "Unknown User"}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground/100 truncate w-full text-left ml-2">
                    {user ? getTrustLevelLabel(user.trust_level) : "Trust Level Unknown"}
                  </span>
                </div>
                <ChevronDown className="size-4 text-muted-foreground ml-auto group-data-[collapsible=icon]:hidden" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={isMobile || state === "collapsed" ? "ml-1 w-68 z-[200]" : "w-64 z-[200]"}
              align="start"
              side={isMobile || state === "collapsed" ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel>
                <div className="flex flex-col items-center mb-4 gap-1 pt-4">
                  <div
                    className="relative w-32 h-16 flex items-center justify-center overflow-visible cursor-pointer select-none transition-transform active:scale-95"
                    onClick={() => setShowEffect(!showEffect)}
                  >
                    <InteractionDecoration
                      show={showEffect}
                      className={interactionDecorationConfig?.className}
                    />
                    <div className="relative z-10">
                      <MainDecoration className={largeMainDecorationConfig?.className} />
                      <Avatar className="size-14 rounded-full pointer-events-none">
                        <AvatarImage
                          src={user?.avatar_url}
                          alt={user?.nickname}
                        />
                        <AvatarFallback className="rounded-full bg-transparent text-lg">
                          {user?.nickname?.charAt(0)?.toUpperCase() || "L"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <span className="text-base font-semibold truncate mt-2">
                    {user?.nickname || user?.username || "Unknown User"}
                  </span>
                  <span className="text-xs font-base text-muted-foreground">
                    {user ? getTrustLevelLabel(user.trust_level) : "Trust Level Unknown"}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                router.push("/settings/profile")
                handleCloseSidebar()
              }}>
                <UserRound className="mr-2 size-4" />
                <span>我的资料</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                router.push("/settings")
                handleCloseSidebar()
              }}>
                <Settings className="mr-2 size-4" />
                <span>设置</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem onClick={() => {
                router.push("/docs/how-to-use")
                handleCloseSidebar()
              }}>
                <FileQuestionMark className="mr-2 size-4" />
                <span>使用帮助</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive hover:bg-destructive/50" onClick={() => setShowLogoutDialog(true)}>
                <LogOut className="mr-2 size-4 text-destructive" />
                <span>退出登录</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarHeader>
        <SidebarContent className="group-data-[collapsible=icon]">
          <SidebarGroup className="py-0">
            <SidebarGroupContent className="py-1">
              <SidebarMenu className="gap-1">
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={pathname === item.url}
                      asChild
                    >
                      <Link href={item.url} onClick={handleCloseSidebar}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {user?.is_admin && (
            <SidebarGroup className="py-0 pt-4">
              <SidebarGroupLabel className="text-xs font-normal text-muted-foreground">
                管理
              </SidebarGroupLabel>
              <SidebarGroupContent className="py-1">
                <SidebarMenu className="gap-1">
                  {data.admin.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={pathname === item.url}
                        asChild
                      >
                        <Link href={item.url} onClick={handleCloseSidebar}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarGroup className="py-0 pt-4">
            <SidebarGroupLabel className="text-xs font-normal text-muted-foreground">
              文档库
            </SidebarGroupLabel>
            <SidebarGroupContent className="py-1">
              <SidebarMenu className="gap-1">
                {data.document.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      asChild
                    >
                      <Link href={item.url} target="_blank" rel="noopener noreferrer" onClick={handleCloseSidebar}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="py-0 pt-4">
            <SidebarGroupLabel className="text-xs font-normal text-muted-foreground">
              服务
            </SidebarGroupLabel>
            <SidebarGroupContent className="py-1">
              <SidebarMenu className="gap-1">
                {data.products.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      asChild
                    >
                      <Link href={item.url} onClick={handleCloseSidebar}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <AlertDialog open={showLogoutDialog} onOpenChange={(open) => !isLoggingOut && setShowLogoutDialog(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认登出</AlertDialogTitle>
            <AlertDialogDescription>
              {isLoggingOut ? '正在登出，请稍候...' : '您确定要登出当前账户吗？'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut && <Spinner className="mr-2" />}
              {isLoggingOut ? '登出中...' : '确认登出'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
