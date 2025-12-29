"use client"

import * as React from "react"
import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { PayLevel, User } from "@/lib/services/auth"
import { useUser } from "@/contexts/user-context"
import services from "@/lib/services"
import type { UserPayConfig } from "@/lib/services/admin"


/**
 * 等级配置
 */
interface LevelConfig {
  level: PayLevel
  name: string
  nameEn: string
  minScore: number
  maxScore: number | null
  gradient: string
  textColor: string
  metalEffect?: boolean
  dailyLimit: number | null
  feeRate: number | string
  scoreRate: number | string
}

/** 等级视觉样式配置（不包含业务数据） */
const LEVEL_STYLES = [
  {
    level: PayLevel.Ordinary,
    name: "普通会员",
    nameEn: "ORDINARY MEMBER",
    gradient: "from-[#1e3a8a] via-[#2563eb] to-[#1d4ed8] shadow-lg shadow-blue-900/10",
    textColor: "text-white/95",
  },
  {
    level: PayLevel.Gold,
    name: "黄金会员",
    nameEn: "GOLD MEMBER",
    gradient: "from-[#FDFCF0] via-[#FCE38A] to-[#B45309] shadow-lg shadow-amber-500/10",
    textColor: "text-[#854D0E]",
    metalEffect: true,
  },
  {
    level: PayLevel.WhiteGold,
    name: "白金会员",
    nameEn: "PLATINUM MEMBER",
    gradient: "from-[#F8FAFC] via-[#E2E8F0] to-[#94A3B8] shadow-lg shadow-slate-500/10",
    textColor: "text-slate-800",
    metalEffect: true,
  },
  {
    level: PayLevel.BlackGold,
    name: "黑金会员",
    nameEn: "BLACK MEMBER",
    gradient: "from-[#020617] via-[#1e293b] to-[#020617] shadow-lg shadow-black/20",
    textColor: "text-[#FFE5B4]",
    metalEffect: true,
  },
] as const

/** 合并 API 数据和视觉样式 */
function mergeLevelConfigs(apiConfigs: UserPayConfig[]): LevelConfig[] {
  return LEVEL_STYLES.map(style => {
    const apiConfig = apiConfigs.find(c => c.level === style.level)
    if (apiConfig) {
      return {
        ...style,
        minScore: apiConfig.min_score,
        maxScore: apiConfig.max_score,
        dailyLimit: apiConfig.daily_limit,
        feeRate: apiConfig.fee_rate,
        scoreRate: apiConfig.score_rate,
      }
    }
    return {
      ...style,
      minScore: 0,
      maxScore: null,
      dailyLimit: null,
      feeRate: 0,
      scoreRate: 0,
    }
  })
}

function getLevelConfig(score: number, configs: LevelConfig[]): LevelConfig {
  if (configs.length === 0) {
    return {
      level: PayLevel.Ordinary,
      name: "加载中...",
      nameEn: "LOADING...",
      gradient: "from-blue-600 via-blue-500 to-blue-700",
      textColor: "text-white",
      minScore: 0,
      maxScore: null,
      dailyLimit: null,
      feeRate: 0,
      scoreRate: 0,
    }
  }

  for (let i = configs.length - 1; i >= 0; i--) {
    if (score >= configs[i].minScore) {
      return configs[i]
    }
  }
  return configs[0]
}

function MembershipCard({
  config,
  user,
  score,
  currentLevel,
  isActive,
  levelConfigs,
}: {
  config: LevelConfig
  user: User
  score: number
  currentLevel: LevelConfig
  isActive: boolean
  levelConfigs: LevelConfig[]
}) {
  const isAccessible = levelConfigs.findIndex(l => l.level === config.level) <= levelConfigs.findIndex(l => l.level === currentLevel.level)
  const isDarkCard = config.level === PayLevel.BlackGold || config.level === PayLevel.Ordinary

  return (
    <div
      className={cn(
        "transition-all duration-500",
        isActive ? "opacity-100 scale-100" : "opacity-40 scale-95"
      )}
    >
      <div
        className={cn(
          "relative w-full aspect-[2/1] rounded-xl overflow-hidden bg-gradient-to-br shadow-lg",
          config.gradient,
          config.metalEffect && "shadow-2xl"
        )}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="absolute inset-0 opacity-[0.15] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {config.metalEffect && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-white/2 to-transparent" />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/25" />
            <div className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-white/15 via-transparent to-transparent rounded-t-xl" />
          </>
        )}

        <div className={cn("relative h-full flex flex-col justify-between p-3 sm:p-4 md:p-5", config.textColor)}>
          <div>
            <div className="text-[8px] sm:text-[9px] md:text-[10px] font-medium opacity-70 tracking-wider">
              {config.nameEn}
            </div>
            <div className="text-sm sm:text-base md:text-lg font-bold tracking-tight">
              {config.name}
            </div>
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            <div className="text-[8px] sm:text-[9px] md:text-[10px] opacity-70 tracking-wide">平台分数</div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight tabular-nums">
              {score.toLocaleString()}
            </div>
          </div>

          <div className="flex items-end justify-between gap-1">
            <div className="text-[8px] sm:text-[9px] md:text-[10px] opacity-70">
              LINUX DO <span className="italic font-serif">Credit</span>
            </div>
            <div className="text-right">
              <div className="text-[8px] sm:text-[9px] md:text-[10px] opacity-70">分数范围</div>
              <div className="text-[8px] sm:text-[9px] md:text-[10px] font-medium tabular-nums">
                {config.minScore.toLocaleString()} - {config.maxScore?.toLocaleString() || "∞"}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-5 md:right-5">
          {isAccessible ? (
            <Avatar className="size-8 sm:size-9 md:size-10 border-2 border-white/20">
              <AvatarImage src={user?.avatar_url} alt={user?.nickname} />
              <AvatarFallback
                className={cn(
                  "text-xs sm:text-sm font-semibold",
                  isDarkCard ? "bg-white/20 text-white" : "bg-black/20 text-black"
                )}
              >
                {user?.nickname?.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div
              className={cn(
                "px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] md:text-[10px] font-semibold backdrop-blur-sm",
                isDarkCard ? "bg-white/20 text-white" : "bg-black/20 text-black"
              )}
            >
              未获得
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getPayLevelLabel(level: PayLevel): string {
  switch (level) {
    case PayLevel.BlackGold:
      return "黑金会员"
    case PayLevel.WhiteGold:
      return "白金会员"
    case PayLevel.Gold:
      return "黄金会员"
    case PayLevel.Ordinary:
      return "普通会员"
    default:
      return "未知等级"
  }
}

export function ProfileMain() {
  const { user, loading, getTrustLevelLabel } = useUser()
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [levelConfigs, setLevelConfigs] = React.useState<LevelConfig[]>([])

  const score = user?.pay_score ?? 0
  const currentLevel = getLevelConfig(score, levelConfigs)

  React.useEffect(() => {
    async function fetchPayConfigs() {
      const configs = await services.config.getUserPayConfigs()
      setLevelConfigs(mergeLevelConfigs(configs))
    }
    fetchPayConfigs()
  }, [])

  React.useEffect(() => {
    if (!api) return

    setCurrent(api.selectedScrollSnap())
    api.on("select", () => setCurrent(api.selectedScrollSnap()))
  }, [api])

  React.useEffect(() => {
    if (!api || levelConfigs.length === 0 || !currentLevel) return

    const scrollToCurrentLevel = () => {
      const currentLevelIndex = levelConfigs.findIndex(
        (config) => config.level === currentLevel.level
      )
      if (currentLevelIndex >= 0) {
        api.scrollTo(currentLevelIndex, true)
      }
    }
    scrollToCurrentLevel()
    api.on("reInit", scrollToCurrentLevel)
    return () => {
      api.off("reInit", scrollToCurrentLevel)
    }
  }, [api, currentLevel, levelConfigs])

  if (loading) {
    return (
      <div className="py-6 space-y-4">
        <div className="border-b border-border pb-4">
          <h1 className="text-2xl font-semibold">个人资料</h1>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="py-6 space-y-6">
        <div className="text-sm text-muted-foreground">未找到用户信息</div>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6">
      <div className="font-semibold">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/settings" className="text-base text-primary">设置</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-base font-semibold">个人资料</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <h2 className="font-medium text-sm text-muted-foreground">会员等级</h2>

      <Carousel
        setApi={setApi}
        opts={{
          align: "center",
          loop: false,
          containScroll: false,
        }}
        className="w-full relative"
      >
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
        <CarouselContent className="-ml-4">
          {levelConfigs.map((config, index) => (
            <CarouselItem key={config.level} className="pl-4 basis-[85%] sm:basis-[70%] md:basis-[65%] lg:basis-[50%] xl:basis-[40%] 2xl:basis-[35%]">
              <MembershipCard
                config={config}
                user={user}
                score={score}
                currentLevel={currentLevel}
                isActive={index === current}
                levelConfigs={levelConfigs}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0" />
        <CarouselNext className="right-0" />
      </Carousel>


      <div className="space-y-4">
        <h2 className="font-medium text-sm text-muted-foreground">基本信息</h2>

        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <Avatar className="size-14 sm:size-16">
            <AvatarImage src={user.avatar_url} alt={user.nickname || user.username} />
            <AvatarFallback className="text-lg sm:text-xl">
              {(user.nickname || user.username).slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 w-full">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">账户</div>
                <div className="text-sm font-medium">@{user.username}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">昵称</div>
                <div className="text-sm font-medium">{user.nickname || '未设置'}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">用户ID</div>
                <div className="text-sm font-medium">{user.id}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">信任等级</div>
                <div className="text-sm font-medium">{getTrustLevelLabel(user.trust_level)}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">平台等级</div>
                <div className="text-sm font-medium">{getPayLevelLabel(user.pay_level)}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">平台分数</div>
                <div className="text-sm font-medium">{user.pay_score.toLocaleString()}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">每日流转限额</div>
                <div className="text-sm font-medium">
                  {currentLevel.dailyLimit ? `${ currentLevel.dailyLimit.toLocaleString() } 积分` : '无限额'}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">集市手续费率</div>
                <div className="text-sm font-medium">
                  {typeof currentLevel.feeRate === 'number'
                    ? `${ (currentLevel.feeRate * 100).toFixed(2) }%`
                    : `${ (parseFloat(currentLevel.feeRate as string) * 100).toFixed(2) }%`}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">平台分数转化率</div>
                <div className="text-sm font-medium">
                  {typeof currentLevel.scoreRate === 'number'
                    ? `${ (currentLevel.scoreRate * 100).toFixed(2) }%`
                    : `${ (parseFloat(currentLevel.scoreRate as string) * 100).toFixed(2) }%`}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  积分基准值
                  <Popover>
                    <PopoverTrigger>
                      <Info className="h-3 w-3 cursor-help" />
                    </PopoverTrigger>
                    <PopoverContent side="top" className="w-auto max-w-[280px] p-3">
                      <p className="text-xs">上一次从社区同步的积分基准值</p>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="text-sm font-medium tabular-nums">
                  {parseFloat(user.community_balance).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
