"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
  BarChart3,
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
} from "lucide-react"

import { useUser } from "@/contexts/user-context"


/* 导航数据 */
const data = {
  navMain: [
    { title: "首页", url: "/home", icon: Home },
    { title: "交易", url: "/trade", icon: CircleDollarSign },
    { title: "商户", url: "/merchant", icon: Store },
    { title: "余额", url: "/balance", icon: Wallet },
  ],
  admin: [
    { title: "系统配置", url: "/admin/system", icon: ShieldCheck },
    { title: "支付配置", url: "/admin/user_pay", icon: Settings },
  ],
  document: [
    { title: "接口文档", url: "#", icon: CreditCard },
    { title: "使用文档", url: "#", icon: FileText },
  ],
  products: [
    { title: "报表", url: "#", icon: BarChart3 },
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
  const { toggleSidebar, state } = useSidebar()
  const { user, getTrustLevelLabel, logout } = useUser()
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()
  
  return (
    <>
    <Sidebar collapsible="icon" {...props} className="px-2 relative border-r border-border/40 group-data-[collapsible=icon]">
      <Button
        onClick={toggleSidebar}
        variant="ghost"
        size="icon"
        className="absolute top-1/2 -right-6 w-2 h-4 text-muted-foreground hover:bg-background"
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
      
      <SidebarHeader className="py-4 -ml-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex h-12 hover:bg-accent group-data-[collapsible=icon]"
            >
              <Avatar className="size-6 rounded">
                <AvatarImage
                  src={user?.avatar_url}
                  alt={user?.nickname}
                />
                <AvatarFallback className="rounded bg-muted text-sm">
                  {user?.nickname?.charAt(0)?.toUpperCase() || "L"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start flex-1 text-left group-data-[collapsible=icon]:hidden">
                <span className="text-xs font-medium truncate w-full text-left">
                  {user?.nickname || user?.username || "Unknown User"}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground/100 truncate w-full text-left">
                  {user ? getTrustLevelLabel(user.trust_level) : "Trust Level Unknown"}
                </span>
              </div>
              <ChevronDown className="size-4 text-muted-foreground ml-auto group-data-[collapsible=icon]:hidden" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="start" side="bottom" sideOffset={4}>
            <DropdownMenuLabel>
              <div className="flex flex-col items-center mb-4 gap-1">
                <Avatar className="size-10 rounded">
                  <AvatarImage
                    src={user?.avatar_url}
                    alt={user?.nickname}
                  />
                  <AvatarFallback className="rounded bg-muted text-lg">
                    {user?.nickname?.charAt(0)?.toUpperCase() || "L"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-base font-semibold truncate">
                  {user?.nickname || user?.username || "Unknown User"}
                </span>
                <span className="text-xs font-base text-muted-foreground">
                  {user ? getTrustLevelLabel(user.trust_level) : "Trust Level Unknown"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
              <UserRound className="mr-2 size-4" />
              <span>我的资料</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 size-4" />
              <span>设置</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2"/>
            <DropdownMenuItem>
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
                    <Link href={item.url}>
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
                      <Link href={item.url}>
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
                    <Link href={item.url}>
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
            产品
          </SidebarGroupLabel>
          <SidebarGroupContent className="py-1">
            <SidebarMenu className="gap-1">
              {data.products.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    asChild
                  >
                    <Link href={item.url}>
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

    <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认登出</AlertDialogTitle>
          <AlertDialogDescription>
            您确定要登出当前账户吗？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={logout}>确认登出</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
