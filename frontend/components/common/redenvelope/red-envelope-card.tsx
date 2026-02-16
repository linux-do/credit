"use client"

import * as React from "react"
import Image from "next/image"
import { motion } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface RedEnvelopeCardProps {
  status: "preview" | "ready" | "opening"
  coverImage?: string | null
  heterotypicImage?: string | null
  greeting?: string
  sender?: {
    username?: string
    avatar_url?: string
  }
  onOpen?: () => void
  amount?: string
  className?: string
}

export function RedEnvelopeCard({
  status,
  coverImage,
  greeting,
  sender,
  onOpen,
  className
}: RedEnvelopeCardProps) {
  // 预览模式下不播放入场动画
  const isPreview = status === "preview"

  return (
    <motion.div
      layoutId={!isPreview ? "red-envelope-card" : undefined}
      className={`relative w-full h-full rounded-xl shadow-2xl overflow-hidden z-10 bg-[#F25542] ${ className || "" }`}
      initial={!isPreview ? { opacity: 1 } : undefined}
      animate={!isPreview ? { opacity: 1 } : undefined}
      exit={!isPreview ? { y: -40, opacity: 0, scale: 0.95, transition: { duration: 0.5, ease: "easeInOut" } } : undefined}
    >
      {/* 上半部分 */}
      <div
        className="absolute top-0 h-[78%] overflow-hidden z-10 w-full"
        style={{
          borderRadius: '0 0 100% 100% / 0 0 20% 20%',
          backgroundColor: coverImage ? '#f35543' : '#E75240',
          boxShadow: '0 2px 2px rgba(0,0,0,0.15)'
        }}
      >
        {/* 自定义背景封面 */}
        {coverImage ? (
          <div className="absolute inset-0">
            <Image
              src={coverImage}
              alt="红包封面"
              fill
              className="object-cover"
              unoptimized
              loading="eager"
            />
            {/* 半透明遮罩以确保内容可读 */}
            <div className="absolute inset-0 bg-black/10" />
          </div>
        ) : null}

        {/* 用户信息 */}
        <div className="absolute top-28 left-0 right-0 flex flex-col items-center justify-center text-[#FAE5AE] z-20 px-6 space-y-4">
          <motion.div
            initial={!isPreview ? { scale: 0 } : undefined}
            animate={!isPreview ? { scale: 1 } : undefined}
            transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
            className="flex items-center gap-2 opacity-90"
          >
            <Avatar className="h-8 w-8 rounded-md border border-white/20 shadow-sm">
              <AvatarImage src={sender?.avatar_url} alt={sender?.username} />
              <AvatarFallback className="bg-[#FAE5AE] text-[#E75240] font-bold text-xs rounded-md">
                {sender?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-base font-medium tracking-wide">{sender?.username || '你'} 的红包</span>
          </motion.div>

          <motion.p
            initial={!isPreview ? { opacity: 0, y: 10 } : undefined}
            animate={!isPreview ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.3 }}
            className="text-xl font-medium tracking-wider text-center opacity-90"
          >
            {greeting || "新年快乐，恭喜发财"}
          </motion.p>
        </div>
      </div>

      {/* 开启按钮 */}
      <div className="absolute top-[78%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        {status === "opening" && (
          <motion.div
            className="absolute inset-0 -m-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: [0.9, 2.0], opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{ background: "radial-gradient(circle, rgba(255,232,168,0.8) 0%, rgba(245,205,122,0.4) 35%, transparent 65%)" }}
            />
          </motion.div>
        )}

        <motion.button
          className="relative w-20 h-20 rounded-full bg-[#EFC77A] flex items-center justify-center shadow-lg cursor-pointer border-none focus:outline-none overflow-hidden group"
          whileHover={status === "ready" || isPreview ? { scale: 1.05 } : {}}
          whileTap={status === "ready" || isPreview ? { scale: 0.95 } : {}}
          animate={status === "opening" ? {
            scale: [1, 0.92, 0],
            opacity: [1, 0]
          } : {}}
          transition={status === "opening" ? {
            duration: 0.55,
            ease: "easeInOut"
          } : {
            duration: 0.2
          }}
          onClick={status === "ready" ? onOpen : undefined}
          disabled={status !== "ready" && !isPreview}
        >
          <span className="relative text-[#4D4753] font-bold text-3xl z-10" style={{ fontFamily: 'serif' }}>
            開
          </span>
        </motion.button>
      </div>
    </motion.div>
  )
}
