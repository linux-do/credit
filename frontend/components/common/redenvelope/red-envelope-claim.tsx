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
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-background p-2 sm:p-4 overflow-hidden">
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {/* 统一卡片容器 - 响应式尺寸 */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-72 h-[420px] sm:w-80 sm:h-[480px] md:w-[360px] md:h-[540px] rounded-3xl shadow-2xl overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {(state === "ready" || state === "opening") && (
              <motion.div
                key="cover"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ y: -40, opacity: 0, scale: 0.95, transition: { duration: 0.5, ease: "easeInOut" } }}
                className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-700"
              >
                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-yellow-400/30 via-yellow-500/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />

                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 left-10 w-20 h-20 border-2 border-yellow-300 rounded-full" />
                  <div className="absolute top-20 right-12 w-16 h-16 border-2 border-yellow-300 rounded-full" />
                  <div className="absolute bottom-20 left-16 w-24 h-24 border-2 border-yellow-300 rounded-full" />
                </div>

                <div className="absolute top-12 left-0 right-0 text-center z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
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

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  {state === "opening" && (
                    <motion.div
                      className="absolute inset-0 -m-6"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 2.5, opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      <div className="w-full h-full rounded-full" style={{ background: "radial-gradient(circle, rgba(253,224,71,0.7) 0%, rgba(250,204,21,0.4) 30%, transparent 60%)" }} />
                    </motion.div>
                  )}

                  <motion.button
                    className="relative w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 flex items-center justify-center shadow-2xl cursor-pointer border-4 border-yellow-200/50 focus:outline-none"
                    whileHover={state === "ready" ? { scale: 1.08 } : {}}
                    whileTap={state === "ready" ? { scale: 0.95 } : {}}
                    animate={state === "opening" ? {
                      scale: [1, 1.2, 0.8, 0],
                      opacity: [1, 1, 1, 0]
                    } : {}}
                    transition={state === "opening" ? {
                      duration: 0.7,
                      ease: "easeInOut"
                    } : {
                      duration: 0.2
                    }}
                    onClick={state === "ready" ? handleOpen : undefined}
                    disabled={state !== "ready"}
                  >
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-200 to-transparent opacity-60" />
                    <span className="relative text-red-600 font-bold text-3xl z-10" style={{ fontFamily: 'serif' }}>
                      開
                    </span>

                    {state === "ready" && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-yellow-300/70"
                        animate={{ scale: [1, 1.2], opacity: [0.7, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                      />
                    )}
                  </motion.button>
                </div>

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
              </motion.div>
            )}

            {(state === "claimed" || state === "opened") && (
              <motion.div
                key="result"
                initial={{ y: 30, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute inset-0 bg-card backdrop-blur-2xl flex flex-col"
              >
                <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 px-4 py-3 sm:px-6 sm:py-5 text-center relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 left-4 w-12 h-12 border-2 border-yellow-300 rounded-full" />
                    <div className="absolute bottom-4 right-4 w-16 h-16 border-2 border-yellow-300 rounded-full" />
                  </div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-1.5 sm:mb-2 border-2 border-yellow-400/80 shadow-lg relative z-10">
                      <AvatarImage src={envelope?.creator_avatar_url} alt={envelope?.creator_username} />
                      <AvatarFallback className="bg-gradient-to-br from-yellow-300 to-yellow-500 text-red-600 font-bold text-sm sm:text-base">
                        {envelope?.creator_username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <p className="text-yellow-100 font-medium text-xs sm:text-sm relative z-10">{envelope?.creator_username} 的红包</p>
                  <p className="text-yellow-100/90 text-[10px] sm:text-xs mt-0.5 relative z-10">
                    {envelope?.greeting || "恭喜发财，大吉大利"}
                  </p>
                </div>

                {claimedAmount && (
                  <div className="px-4 py-3 sm:px-6 sm:py-4 text-center border-b border-border/50 shrink-0">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.3 }}
                    >
                      <p className="text-3xl sm:text-4xl font-bold text-red-500 mb-0.5 sm:mb-1">{claimedAmount}</p>
                      <p className="text-muted-foreground text-[10px] sm:text-xs">LDC</p>
                    </motion.div>
                  </div>
                )}

                <div className="px-3 py-2 sm:px-5 sm:py-4 flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-center mb-2 sm:mb-3 text-[10px] sm:text-xs text-muted-foreground shrink-0">
                    <span>
                      {detail?.claims.length || 0}/{envelope?.total_count} 个红包已领取
                    </span>
                    <span>
                      {envelope?.remaining_amount}/{envelope?.total_amount} LDC
                    </span>
                  </div>

                  <ScrollArea className="flex-1 min-h-0">
                    <div className="space-y-1 sm:space-y-2">
                      {detail?.claims.map((claim: RedEnvelopeClaim) => (
                        <motion.div
                          key={claim.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between py-1 sm:py-1.5"
                        >
                          <div className="flex items-center gap-2 sm:gap-2.5 overflow-hidden">
                            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 shrink-0">
                              <AvatarImage src={claim.avatar_url} alt={claim.username} />
                              <AvatarFallback className="text-[10px] sm:text-xs">
                                {claim.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs sm:text-sm font-medium truncate">{claim.username}</span>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-red-500 shrink-0">{claim.amount} LDC</span>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="px-3 py-2 sm:px-5 sm:py-4 border-t border-border/50 shrink-0">
                  <Button
                    className="w-full bg-red-500 hover:bg-red-600 text-white h-8 sm:h-10 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm"
                    onClick={() => window.location.href = "/trade"}
                  >
                    查看我的红包
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}