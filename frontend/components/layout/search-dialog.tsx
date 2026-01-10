"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { searchItems, type SearchItem } from "@/lib/utils/search-data"
import { Home, Settings, FileText, Shield } from "lucide-react"
import { useUser } from "@/contexts/user-context"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const categoryIcons = {
  page: Home,
  feature: FileText,
  setting: Settings,
  admin: Shield,
}

const categoryLabels = {
  page: '页面',
  feature: '功能',
  setting: '设置',
  admin: '管理',
}

const getTips = (metaKey: string) => [
  (
    <>
      <span className="text-muted-foreground/80 lowercase">Tips: 还可以使用</span>
      <kbd className="bg-muted px-1.5 py-0.5 rounded border shadow-sm text-foreground mx-1">/</kbd>
      <span className="text-muted-foreground/80 lowercase">来打开此界面</span>
    </>
  ),
  (
    <>
      <span className="text-muted-foreground/80 lowercase">Tips: 使用</span>
      <kbd className="bg-muted px-1.5 py-0.5 rounded border shadow-sm text-foreground mx-1">↑</kbd>
      <kbd className="bg-muted px-1.5 py-0.5 rounded border shadow-sm text-foreground mx-1">↓</kbd>
      <span className="text-muted-foreground/80 lowercase">来切换选中项</span>
    </>
  ),
  (
    <>
      <span className="text-muted-foreground/80 lowercase">Tips: 按住</span>
      <kbd className="bg-muted px-1.5 py-0.5 rounded border shadow-sm text-foreground mx-1">{metaKey}</kbd>
      <span className="text-muted-foreground/80 lowercase">+</span>
      <kbd className="bg-muted px-1.5 py-0.5 rounded border shadow-sm text-foreground mx-1">↵</kbd>
      <span className="text-muted-foreground/80 lowercase">在新标签页打开</span>
    </>
  ),
  (
    <>
      <span className="text-muted-foreground/80 lowercase">你知道吗：搜索功能还在持续升级中</span>
    </>
  ),
  (
    <>
      <span className="text-muted-foreground/80 lowercase">你知道吗：积分会在每天 0 点更新</span>
    </>
  ),
  (
    <>
      <span className="text-muted-foreground/80 lowercase">你知道吗：新用户前三天享有划转掉分保护</span>
    </>
  ),
  (
    <>
      <span className="text-muted-foreground/80 lowercase">想实时查看积分变化？试试这个</span>
      <a 
        href="https://linux.do/t/topic/1365853" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary hover:underline mx-1"
      >
        脚本
      </a>
    </>
  ),
  (
    <>
      <span className="text-muted-foreground/80 lowercase">有65！w</span>
    </>
  ),
  (
    <>
      <span className="text-muted-foreground/80 lowercase">遇到问题？欢迎提交</span>
      <a 
        href="https://github.com/linux-do/credit/issues" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary hover:underline mx-1"
      >
        Issue
      </a>
      <span className="text-muted-foreground/80 lowercase">反馈</span>
    </>
  )

]

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter()
  const { user } = useUser()
  const [search, setSearch] = useState('')
  const [currentTip, setCurrentTip] = useState<React.ReactNode>(null)
  const [results, setResults] = useState<SearchItem[]>([])
  const [metaKey, setMetaKey] = useState("⌘")
  const [isCtrlPressed, setIsCtrlPressed] = useState(false)

  useEffect(() => {
    if (typeof navigator !== 'undefined' && !navigator.userAgent?.includes("Mac")) {
      setMetaKey("Ctrl")
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(true)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    if (open) {
      const tips = getTips(metaKey)
      const randomTip = tips[Math.floor(Math.random() * tips.length)]
      setCurrentTip(randomTip)
    }
  }, [open, metaKey])

  useEffect(() => {
    const items = searchItems(search, user?.is_admin)
    setResults(items)
  }, [search, user?.is_admin])

  const handleSelect = useCallback((item: SearchItem, openInNewTab = false) => {
    onOpenChange(false)
    if (openInNewTab) {
      window.open(item.url, '_blank')
    } else {
      router.push(item.url)
    }
    setSearch('')
  }, [onOpenChange, router])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }

      if (e.key === '/'&& !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        const isEditing = target.tagName === 'INPUT' || 
                         target.tagName === 'TEXTAREA' || 
                         target.tagName === 'SELECT' ||
                         target.isContentEditable ||
                         target.closest('[contenteditable="true"]')

        if (!isEditing) {
          e.preventDefault()
          onOpenChange(true)
        }
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  // Group results by category
  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, SearchItem[]>)

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="搜索页面和功能..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>没有找到相关内容，换个词试试？</CommandEmpty>
        {Object.entries(groupedResults).map(([category, items]) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons]
          return (
            <CommandGroup key={category} heading={categoryLabels[category as keyof typeof categoryLabels]}>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.title}
                  onSelect={() => handleSelect(item, isCtrlPressed)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>
                        {item.matchRange ? (
                          <>
                            {item.title.substring(0, item.matchRange[0])}
                            <span className="text-primary font-bold">
                              {item.title.substring(item.matchRange[0], item.matchRange[1] + 1)}
                            </span>
                            {item.title.substring(item.matchRange[1] + 1)}
                          </>
                        ) : (
                          item.title
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md font-medium">
                    {categoryLabels[item.category as keyof typeof categoryLabels]}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )
        })}
      </CommandList>
      <div className="hidden border-t bg-muted/20 px-4 py-2 md:flex items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium select-none">
        <div className="flex items-center gap-1">
          {isCtrlPressed && <kbd className="bg-muted px-1.5 py-0.5 rounded border shadow-sm text-foreground">{metaKey}</kbd>}
          <kbd className="bg-muted px-1.5 py-0.5 rounded border shadow-sm text-foreground">↵</kbd>
          <span>{isCtrlPressed ? '在新标签页打开' : '打开'}</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="bg-muted px-1.5 py-0.5 rounded border shadow-sm text-foreground">Esc</kbd>
          <span>关闭搜索界面</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {currentTip}
        </div>
      </div>
    </CommandDialog>
  )
}
