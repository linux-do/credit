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

const tips = [
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
      <span className="text-muted-foreground/80 lowercase">Tips: 按下</span>
      <kbd className="bg-muted px-1.5 py-0.5 rounded border shadow-sm text-foreground mx-1">Enter</kbd>
      <span className="text-muted-foreground/80 lowercase">来跳转到对应页面</span>
    </>
  ),
  (
    <>
      <span className="text-muted-foreground/80 lowercase">你知道吗：搜索功能还在持续升级中</span>
    </>
  )
/*
  (
    <>
      <span className="text-muted-foreground/80 lowercase">有65！w</span>
    </>
  )
*/
]

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [currentTip, setCurrentTip] = useState<React.ReactNode>(tips[0])
  const [results, setResults] = useState<SearchItem[]>([])

  useEffect(() => {
    if (open) {
      const randomTip = tips[Math.floor(Math.random() * tips.length)]
      setCurrentTip(randomTip)
    }
  }, [open])

  useEffect(() => {
    const items = searchItems(search)
    setResults(items)
  }, [search])

  const handleSelect = useCallback((item: SearchItem) => {
    onOpenChange(false)
    router.push(item.url)
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
    <CommandDialog open={open} onOpenChange={onOpenChange}>
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
                  onSelect={() => handleSelect(item)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>
                      {item.title.split(new RegExp(`(${search})`, 'gi')).map((part, i) => 
                        part.toLowerCase() === search.toLowerCase() ? 
                          <span key={i} className="text-primary font-bold">{part}</span> : 
                          part
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )
        })}
      </CommandList>
      <div className="hidden border-t bg-muted/20 px-4 py-2 md:flex items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium select-none">
        <div className="flex items-center gap-1">
          <kbd className="bg-muted px-1.5 py-0.5 rounded border shadow-sm text-foreground">↵</kbd>
          <span>打开</span>
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
