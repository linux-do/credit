"use client"

import { createContext, useContext, useState, useCallback, useRef } from "react"

interface BellRingContextType {
  isRinging: boolean
  triggerRing: () => void
}

const BellRingContext = createContext<BellRingContextType | undefined>(undefined)

/**
 * 铃铛响铃动画上下文提供者
 * 用于在 toast 通知时触发顶栏铃铛的响铃动画
 */
export function BellRingProvider({ children }: { children: React.ReactNode }) {
  const [isRinging, setIsRinging] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const triggerRing = useCallback(() => {
    // 如果正在响铃，立即重新开始动画
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsRinging(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsRinging(true)
        timeoutRef.current = setTimeout(() => {
          setIsRinging(false)
          timeoutRef.current = null
        }, 600)
      })
    })
  }, [])

  return (
    <BellRingContext.Provider value={{ isRinging, triggerRing }}>
      {children}
    </BellRingContext.Provider>
  )
}

/**
 * 使用铃铛响铃动画的 Hook
 * @returns {{ isRinging: boolean, triggerRing: () => void }}
 */
export function useBellRing() {
  const context = useContext(BellRingContext)
  if (context === undefined) {
    throw new Error("useBellRing must be used within a BellRingProvider")
  }
  return context
}
