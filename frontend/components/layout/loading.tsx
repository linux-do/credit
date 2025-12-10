import * as React from "react"
import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { FileTextIcon } from "lucide-react"

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

function LoadingCard() {
  return (
    <div className="relative w-[240px] aspect-[1.586] mx-auto perspective-1200 group">
      <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] blur-[80px] pointer-events-none transition-colors duration-1000 bg-primary/10")} />

      <motion.div
        initial={{ rotateY: 0, rotateX: 0, y: 0 }}
        animate={{
          rotateY: [-10, 10, -10],
          rotateX: [4, -4, 4],
          y: [-6, 6, -6],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-full h-full"
      >
        <div
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[85%] h-4 bg-black/40 blur-xl rounded-[100%] transition-all duration-500"
          style={{ transform: 'translateZ(-20px)' }}
        />
        <div className={cn("absolute inset-0 rounded-2xl bg-[#1a1a1a] shadow-2xl border border-white/10 overflow-hidden backdrop-blur-xl")}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
          <div className="relative h-full p-6 flex flex-col justify-between z-10">
            <div className="flex justify-between items-start">
              <div className="relative w-11 h-8 rounded-md bg-[#d4d4d8] shadow-inner overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(0,0,0,0.1)_50%,transparent_100%)]" />
                <div className="w-full h-[1px] bg-black/10 absolute top-1/2" />
                <div className="h-full w-[1px] bg-black/10 absolute left-1/3" />
                <div className="h-full w-[1px] bg-black/10 absolute right-1/3" />
              </div>

              <div className="flex flex-col items-end gap-[2px]">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex gap-2">
                <div className="h-1 w-12 rounded-full bg-white/10" />
                <div className="h-1 w-8 rounded-full bg-white/10" />
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div className="space-y-1.5">
                <div className="h-1.5 w-20 rounded-full bg-white/20" />
                <div className="h-1.5 w-12 rounded-full bg-white/20" />
              </div>

              <div className="font-serif italic text-xl font-bold tracking-widest text-white drop-shadow-md">
                PAY
              </div>
            </div>
          </div>

          <motion.div
            className="absolute -inset-[200%] bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 2
            }}
            style={{ mixBlendMode: 'overlay' }}
          />
        </div>

        <div
          className={cn("absolute inset-0 rounded-2xl translate-z-[-2px] border border-white/5 bg-[#0f0f0f]")}
          style={{ transform: 'translateZ(-2px)' }}
        />
        <div
          className={cn("absolute inset-0 rounded-2xl translate-z-[-4px] border border-white/5 bg-[#0f0f0f]")}
          style={{ transform: 'translateZ(-4px)' }}
        />

        <div
          className="absolute inset-0 rounded-2xl bg-black/80 translate-z-[-10px] blur-xl"
          style={{ transform: 'translateZ(-15px)' }}
        />
      </motion.div>
    </div>
  )
}

/**
 * 加载页面组件
 * 
 * 用于统一显示加载状态
 */
export function LoadingPage({ text = "系统", badgeText = "系统" }: { text?: string, badgeText?: string }) {
  return (
    <div className="absolute inset-0 z-50 overflow-hidden font-sans bg-background/80 backdrop-blur-md text-foreground flex items-center justify-center">
      <div className="w-full max-w-md mx-auto text-center px-4 flex flex-col items-center gap-8">
        <LoadingCard />

        <div className="space-y-3 w-full flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative flex items-center justify-center gap-2"
          >
            <span className="text-3xl font-bold tracking-tight text-foreground">LINUX DO</span>
            <span className="text-4xl font-serif font-bold italic text-primary">PAY</span>

            {badgeText && (
              <div className="absolute left-full top-1/3 -translate-y-1/2 ml-2">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-foreground/20 text-muted-foreground whitespace-nowrap">
                  {badgeText}
                </Badge>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center justify-center gap-4 text-sm text-muted-foreground w-full max-w-[200px]"
          >
            <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="absolute inset-y-0 left-0 h-full w-1/3 rounded-full bg-primary"
                animate={{
                  x: ["-100%", "300%"],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            <span className="font-mono text-xs tracking-wider opacity-60">{text.toUpperCase()}</span>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

interface LoadingStateProps extends React.ComponentProps<"div"> {
  title?: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  iconSize?: "sm" | "md" | "lg"
}

/**
 * 加载状态展示组件
 * 用于统一显示加载中的状态
 */
export function LoadingState({
  title = "加载中",
  description = "正在获取交易数据...",
  icon: Icon = FileTextIcon,
  className,
  iconSize = "md",
}: LoadingStateProps) {
  const iconSizes = { sm: "size-8", md: "size-10", lg: "size-14" }
  const iconInnerSizes = { sm: "size-4", md: "size-5", lg: "size-7" }

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className={cn(
        "rounded-full bg-muted flex items-center justify-center mb-2 animate-pulse",
        iconSizes[iconSize]
      )}>
        <Icon className={cn("text-muted-foreground", iconInnerSizes[iconSize])} />
      </div>

      {title && (
        <h3 className="text-sm font-medium mb-1 animate-pulse">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-xs text-muted-foreground max-w-md animate-pulse">
          {description}
        </p>
      )}
    </div>
  )
}

/**
 * 带边框的加载状态组件
 */
export function LoadingStateWithBorder(props: LoadingStateProps) {
  return (
    <div className="border border-dashed rounded-lg">
      <LoadingState {...props} />
    </div>
  )
}
