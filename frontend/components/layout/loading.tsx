import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Badge } from "@/components/ui/badge"


/* 渲染带动画效果的文字 */
const renderAnimatedText = (text: string, startDelay: number = 0) => {
  const chars = text.split('')
  return (
    <span className="inline-flex">
      {chars.map((char, index) => (
        <span
          key={index}
          className="inline-block animate-pulse transition-all duration-800 ease-in-out"
          style={{
            animationDelay: `${startDelay + index * 120}ms`,
            animationFillMode: 'both',
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  )
}

/**
 * 加载页面组件
 * 
 * 用于统一显示加载状态
 * @example
 * ```tsx
 * <LoadingPage text="系统" badgeText="系统" />
 * ```
 * @param {string} text - 显示的文本内容，默认为"系统"
 * @param {string} badgeText - 显示的徽章文本，默认为"系统"
 * @returns {React.ReactNode} 加载页面组件
 */
export function LoadingPage({ text = "系统", badgeText = "系统" }: { text?: string, badgeText?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.2,
            duration: 0.6,
            ease: "easeOut",
          }}
          className="mb-4"
        >
          <div className="relative inline-block text-3xl sm:text-4xl md:text-5xl font-bold text-foreground dark:text-white leading-tight">
            {renderAnimatedText("LINUX DO", 200)}{" "}
            <span className="relative">
              <span className="text-4xl sm:text-5xl md:text-6xl italic font-serif text-blue-600 dark:text-blue-400">
                {renderAnimatedText("PAY", 800)}
              </span>
              <span className="absolute -top-4 md:-top-6 -right-10">
                <Badge variant="outline" className="text-[10px] px-1 h-4">{badgeText}</Badge>
              </span>
            </span>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            className="text-xs md:text-sm text-muted-foreground dark:text-neutral-400"
          >
            {`正在初始化${text}...`}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
