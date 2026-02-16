"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import { Gift } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import services from "@/lib/services"
import { formatDateTime } from "@/lib/utils"
import type { RedEnvelopeDetailResponse, RedEnvelopeClaim } from "@/lib/services"
import { getFileUrl } from "@/lib/services/upload/upload.service"
import { RedEnvelopeCard } from "./red-envelope-card"

interface RedEnvelopeClaimProps {
  id: string
}

type ClaimState = "loading" | "ready" | "opening" | "opened" | "claimed" | "error"

export function RedEnvelopeClaimPage({ id }: RedEnvelopeClaimProps) {
  const [state, setState] = useState<ClaimState>("loading")
  const [detail, setDetail] = useState<RedEnvelopeDetailResponse | null>(null)
  const [claimedAmount, setClaimedAmount] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const bestClaimId = React.useMemo(() => {
    const claims = detail?.claims
    if (!claims || claims.length === 0) return null

    let topId: string | null = null
    let topAmount = -Infinity

    for (const claim of claims) {
      const amount = parseFloat(claim.amount)
      if (Number.isNaN(amount)) continue
      if (amount > topAmount) {
        topAmount = amount
        topId = claim.id
      }
    }

    return topId
  }, [detail?.claims])

  const formatClaimedAt = (claimedAt?: string) => {
    if (!claimedAt) return "-"

    const date = new Date(claimedAt)
    if (Number.isNaN(date.getTime())) return "-"

    const getShanghaiDateKey = (d: Date) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(d)

    const todayKey = getShanghaiDateKey(new Date())
    const claimKey = getShanghaiDateKey(date)

    if (claimKey === todayKey) {
      return new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(date)
    }

    return formatDateTime(date)
  }

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

  // 安全验证图片URL (防止XSS)
  const sanitizeImageUrl = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined

    // 允许相对路径且以 /f/ 开头
    if (!url.startsWith('/f/')) {
      console.warn('Invalid image URL detected:', url)
      return undefined
    }

    // 防止路径遍历
    if (url.includes('..') || url.includes('//')) {
      console.warn('Path traversal detected in URL:', url)
      return undefined
    }

    return url
  }

  // 从后端获取封面图片URL并进行安全验证
  const coverImage = sanitizeImageUrl(getFileUrl(detail?.red_envelope?.cover_upload_id))
  const heterotypicImage = sanitizeImageUrl(getFileUrl(detail?.red_envelope?.heterotypic_upload_id))

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
        {/* 装饰图片容器 */}
        <div className="relative w-72 h-[420px] sm:w-80 sm:h-[480px] md:w-[360px] md:h-[540px]">
          {/* 异形装饰 */}
          {heterotypicImage && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center"
            >
              <Image
                src={heterotypicImage}
                alt="红包装饰"
                fill
                className="object-cover"
                style={{
                  transform: 'scale(1.2)',
                  transformOrigin: 'center'
                }}
                unoptimized
                loading="eager"
              />
            </motion.div>
          )}

          {/* 统一卡片容器 */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
            className="relative w-full max-w-[320px] mx-auto h-auto max-h-[85vh] aspect-[3/5] rounded-xl shadow-2xl overflow-hidden z-10"
          >
            <AnimatePresence mode="wait">
              {(state === "ready" || state === "opening") && (
                <RedEnvelopeCard
                  key="cover"
                  status={state}
                  coverImage={coverImage}
                  greeting={envelope?.greeting}
                  sender={{
                    username: envelope?.creator_username,
                    avatar_url: envelope?.creator_avatar_url
                  }}
                  onOpen={handleOpen}
                />
              )}

              {(state === "claimed" || state === "opened") && (
                <motion.div
                  key="result"
                  initial={{ y: 30, opacity: 0, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  {/* 顶部区域 */}
                  <div className="relative shrink-0">
                    <div
                      className="h-26 w-full bg-[#F25542] relative z-0"
                      style={{
                        borderRadius: '0 0 100% 100% / 0 0 80% 80%'
                      }}
                    >
                      {coverImage && (
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{ borderRadius: '0 0 100% 100% / 0 0 80% 80%' }}
                        >
                          <Image
                            src={coverImage}
                            alt="cover"
                            fill
                            className="object-cover opacity-50"
                            style={{ transform: "scale(1.1)", transformOrigin: "center" }}
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 个人信息 */}
                  <div className="flex flex-col items-center justify-center mt-6 shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6 rounded border border-white/20">
                        <AvatarImage src={envelope?.creator_avatar_url} alt={envelope?.creator_username} />
                        <AvatarFallback className="bg-[#E75240] text-white text-[10px]">
                          {envelope?.creator_username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground/80">{envelope?.creator_username} 发出的红包</span>
                      {envelope?.type === 'random' && (
                        <span className="bg-[#E1B876] text-white text-[10px] px-1 rounded">拼</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs">{envelope?.greeting || "新年快乐，恭喜发财"}</p>
                  </div>

                  {/* 金额区域 */}
                  <div className="bg-white pt-3 pb-6 px-4 text-center shrink-0">
                    {claimedAmount ? (
                      <div>
                        <div className="text-center">
                          <div className="relative inline-block text-[#CFB073] leading-none">
                            <span className="text-5xl font-bold">{parseFloat(claimedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="absolute left-full ml-1 bottom-1 text-sm font-medium">LDC</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4">
                        <p className="text-2xl font-medium text-foreground/80">手慢了，红包派完了</p>
                      </div>
                    )}
                  </div>

                  {/* 列表区域 */}
                  <div className="flex-1 bg-white flex flex-col min-h-0">
                    <div className="px-4 py-1 bg-white text-xs text-gray-400">
                      {detail?.claims.length || 0}个红包共{parseFloat(envelope?.total_amount || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LDC，{
                        envelope?.remaining_count === 0 ? "已被抢光" : "继续等待领取"
                      }
                    </div>
                    <div className="border-t border-border/30" />
                    <ScrollArea className="flex-1 bg-white">
                      <div className="divide-y divide-border/30">
                        {detail?.claims.map((claim: RedEnvelopeClaim) => (
                          <div
                            key={claim.id}
                            className="flex items-start justify-between px-4 py-3"
                          >
                            <div className="flex gap-3">
                              <Avatar className="h-9 w-9 rounded border border-border/10 mt-0.5">
                                <AvatarImage src={claim.avatar_url} alt={claim.username} />
                                <AvatarFallback className="text-xs bg-muted">
                                  {claim.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col items-start gap-0.5">
                                <span className="text-sm font-medium text-foreground/90">{claim.username}</span>
                                <span className="text-xs text-gray-400">
                                  {formatClaimedAt(claim.claimed_at)}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-sm font-bold text-foreground/90">{parseFloat(claim.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LDC</span>
                              {/* 最佳手气 */}
                              {bestClaimId === claim.id && (
                                <div className="flex items-center gap-1 text-[#E1B876] text-[10px]">
                                  <span>手气最佳</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
