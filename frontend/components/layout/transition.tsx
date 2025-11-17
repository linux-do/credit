import { motion } from "motion/react"


/**
 * 页面过渡组件
 * 用于统一显示页面过渡效果
 * 
 * @example
 * ```tsx
 * <PageTransition>
 *   <div>内容</div>
 * </PageTransition>
 * ```
 * @param {React.ReactNode} children - 页面过渡组件的子元素
 * @returns {React.ReactNode} 页面过渡组件
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.6,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  )
}
