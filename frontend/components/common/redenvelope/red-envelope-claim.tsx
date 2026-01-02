"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import { Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import services from "@/lib/services"
import type { RedEnvelopeDetailResponse, RedEnvelopeClaim } from "@/lib/services"

interface RedEnvelopeClaimProps {
  id: string
}

type ClaimState = "loading" | "ready" | "opening" | "opened" | "claimed" | "error"

export function RedEnvelopeClaimPage({ id }: RedEnvelopeClaimProps) {
  const [state, setState] = useState<ClaimState>("loading")
  const [detail, setDetail] = useState<RedEnvelopeDetailResponse | null>(null)
  const [claimedAmount, setClaimedAmount] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadDetail = useCallback(async () => {
    try {
      const data = await services.redEnvelope.getDetail(id)
      console.log('Red envelope data:', data.red_envelope)
      setDetail(data)
      if (data.user_claimed) {
        setClaimedAmount(data.user_claimed.amount)
        setState("claimed")
      } else if (data.red_envelope.status !== "active") {
        setState("opened")
      } else {
        setState("ready")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败")
      setState("error")
    }
  }, [id])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  const handleOpen = async () => {
    setState("opening")
    try {
      const result = await services.redEnvelope.claim({ id })
      setClaimedAmount(result.amount)
      
      // Reload the full details to get updated claims list
      const updatedDetail = await services.redEnvelope.getDetail(id)
      setDetail(updatedDetail)
      
      setTimeout(() => setState("claimed"), 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "领取失败")
      setState("ready")
    }
  }

  if (state === "loading") {
    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
            <Gift className="h-12 w-12 text-red-500" />
          </motion.div>
        </div>
      </div>
    )
  }

  if (state === "error") {
    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
          <motion.div
            className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
          >
            <div className="w-full rounded-3xl p-8 max-w-lg">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-500/10">
                <Gift className="h-8 w-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">
                红包加载失败
              </h1>
              <p className="text-muted-foreground text-sm">
                {error}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  const envelope = detail?.red_envelope

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {(state === "ready" || state === "opening") && (
            <motion.div
              key="envelope"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="flex flex-col items-center justify-center w-full max-w-sm"
            >
              {/* 红包封面 - WeChat style with enhanced visuals */}
              <motion.div
                className="relative w-80 h-[480px]"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                {/* 红包主体 */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-3xl shadow-2xl overflow-hidden">
                  {/* 顶部金色光晕效果 */}
                  <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-yellow-400/30 via-yellow-500/20 to-transparent" />
                  
                  {/* 底部阴影 */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
                  
                  {/* 装饰性图案 */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-20 h-20 border-2 border-yellow-300 rounded-full" />
                    <div className="absolute top-20 right-12 w-16 h-16 border-2 border-yellow-300 rounded-full" />
                    <div className="absolute bottom-20 left-16 w-24 h-24 border-2 border-yellow-300 rounded-full" />
                  </div>

                  {/* 发送者信息 */}
                  <div className="absolute top-12 left-0 right-0 text-center z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <Avatar className="h-14 w-14 mx-auto mb-3 border-2 border-yellow-400/80 shadow-lg">
                        <AvatarImage src={envelope?.creator_avatar_url} alt={envelope?.creator_username} />
                        <AvatarFallback className="bg-gradient-to-br from-yellow-300 to-yellow-500 text-red-600 font-bold text-lg">
                          {envelope?.creator_username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-yellow-100 text-base font-medium"
                    >
                      {envelope?.creator_username} 的红包
                    </motion.p>
                  </div>

                  {/* 中间圆形按钮 - 只有这个可点击 */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <motion.button
                      className="relative w-28 h-28 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 flex items-center justify-center shadow-2xl cursor-pointer border-4 border-yellow-200/50 focus:outline-none focus:ring-4 focus:ring-yellow-300/50"
                      whileHover={state === "ready" ? { scale: 1.1, rotate: [0, -5, 5, -5, 0] } : {}}
                      whileTap={state === "ready" ? { scale: 0.95 } : {}}
                      animate={state === "opening" ? { 
                        rotate: [0, 360],
                        scale: [1, 1.2, 1]
                      } : {
                        y: [0, -8, 0]
                      }}
                      transition={state === "opening" ? {
                        duration: 1.5
                      } : {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      onClick={state === "ready" ? handleOpen : undefined}
                      disabled={state !== "ready"}
                    >
                      {/* 内部光晕 */}
                      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-200 to-transparent opacity-60" />
                      
                      {/* 開 字 */}
                      <span className="relative text-red-600 font-bold text-4xl z-10" style={{ fontFamily: 'serif' }}>
                        開
                      </span>
                      
                      {/* 外部光圈动画 */}
                      {state === "ready" && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-yellow-300"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.8, 0, 0.8]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeOut"
                          }}
                        />
                      )}
                    </motion.button>
                  </div>

                  {/* 祝福语 */}
                  <div className="absolute bottom-20 left-0 right-0 text-center px-8 z-10">
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-yellow-100 text-lg font-medium leading-relaxed"
                    >
                      {envelope?.greeting || "恭喜发财，大吉大利"}
                    </motion.p>
                  </div>
                </div>

                {/* 3D 立体效果阴影 */}
                <div className="absolute inset-0 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] pointer-events-none" />
              </motion.div>

              {state === "ready" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground text-sm mt-8"
                >
                  点击 &ldquo;開&rdquo; 字领取红包
                </motion.p>
              )}
            </motion.div>
          )}

          {(state === "claimed" || state === "opened") && (
            <motion.div
              key="result"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md"
            >
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-card/70 backdrop-blur-2xl border border-border/50 rounded-3xl overflow-hidden shadow-2xl"
              >
                {/* 头部 */}
                <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 p-8 text-center relative overflow-hidden">
                  {/* 背景装饰 */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 left-4 w-16 h-16 border-2 border-yellow-300 rounded-full" />
                    <div className="absolute bottom-4 right-4 w-20 h-20 border-2 border-yellow-300 rounded-full" />
                  </div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-yellow-400/80 shadow-lg relative z-10">
                      <AvatarImage src={envelope?.creator_avatar_url} alt={envelope?.creator_username} />
                      <AvatarFallback className="bg-gradient-to-br from-yellow-300 to-yellow-500 text-red-600 font-bold text-xl">
                        {envelope?.creator_username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <p className="text-yellow-100 font-medium relative z-10">{envelope?.creator_username} 的红包</p>
                  <p className="text-yellow-100/90 text-sm mt-1 relative z-10">
                    {envelope?.greeting || "恭喜发财，大吉大利"}
                  </p>
                </div>

                {/* 领取金额 */}
                {claimedAmount && (
                  <div className="p-8 text-center border-b border-border/50">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.3 }}
                    >
                      <p className="text-5xl font-bold text-red-500 mb-2">{claimedAmount}</p>
                      <p className="text-muted-foreground text-sm">LDC</p>
                    </motion.div>
                  </div>
                )}

                {/* 领取记录 */}
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
                    <span>
                      {detail?.claims.length || 0}/{envelope?.total_count} 个红包已领取
                    </span>
                    <span>
                      {envelope?.remaining_amount}/{envelope?.total_amount} LDC
                    </span>
                  </div>

                  <ScrollArea className="h-56">
                    <div className="space-y-3">
                      {detail?.claims.map((claim: RedEnvelopeClaim) => (
                        <motion.div
                          key={claim.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={claim.avatar_url} alt={claim.username} />
                              <AvatarFallback className="text-sm">
                                {claim.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{claim.username}</span>
                          </div>
                          <span className="text-sm font-semibold text-red-500">{claim.amount} LDC</span>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* 底部按钮 */}
                <div className="p-6 border-t border-border/50">
                  <Button
                    className="w-full bg-red-500 hover:bg-red-600 text-white h-12 rounded-xl font-medium"
                    onClick={() => window.location.href = "/trade"}
                  >
                    查看我的红包
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}