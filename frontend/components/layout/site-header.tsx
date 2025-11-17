import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Bell, HelpCircle, Plus, Settings, Search, Grid3x3, Moon } from "lucide-react"


/**
 * 站点头部组件
 * 用于显示站点头部
 * 
 * @example
 * ```tsx
 * <SiteHeader />
 * ```
 */
export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center bg-background">
      <div className="flex w-full max-w-[1320px] mx-auto px-12 items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索"
            className="h-8 border-none bg-muted/100 pl-10 text-sm"
          />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground">
            <Grid3x3 className="size-[18px]" />
            <span className="sr-only">网格</span>
          </Button>
          <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground">
            <HelpCircle className="size-[18px]" />
            <span className="sr-only">帮助</span>
          </Button>
          <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground">
            <Bell className="size-[18px]" />
            <span className="sr-only">通知</span>
          </Button>
          <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground">
            <Settings className="size-[18px]" />
            <span className="sr-only">设置</span>
          </Button>
          <Button className="mx-1 size-7 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" />
            <span className="sr-only">新建</span>
          </Button>
          
          <div className="ml-2 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">设置指南</span>
            <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground">
              <Moon className="size-[18px]" />
              <span className="sr-only">主题切换</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
