import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js 16 代理层
 *
 * 1. API 请求速率限制
 * 2. 页面身份验证
 */

/* ==================== 速率限制 ==================== */

interface RateLimitEntry {
  count: number
  windowStart: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/** 不需要速率限制的路径 */
const EXCLUDED_PREFIXES = [
  '/api/v1/config',
  '/api/v1/redenvelope/covers',
  '/epay/',
  '/lpay/',
]

/** 速率限制规则: [最大请求数, 窗口时长(ms)] */
const RATE_LIMITS: Record<string, [number, number]> = {
  '/api/v1/oauth/login': [1, 5000],
  '/api/v1/oauth/callback': [1, 5000],
  '/api/v1/upload/redenvelope/cover': [10, 3600000],
  '/api/v1/redenvelope': [30, 60000],
}

/** 默认限制: 60次/60秒 */
const DEFAULT_RATE_LIMIT: [number, number] = [60, 60000]

function getRateLimit(pathname: string): [number, number] {
  if (RATE_LIMITS[pathname]) return RATE_LIMITS[pathname]

  const match = Object.keys(RATE_LIMITS)
    .filter(prefix => pathname.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0]

  return match ? RATE_LIMITS[match] : DEFAULT_RATE_LIMIT
}

function shouldRateLimit(pathname: string): boolean {
  return !EXCLUDED_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

function checkRateLimit(identifier: string, pathname: string): [boolean, number] {
  const [maxRequests, windowMs] = getRateLimit(pathname)
  const key = `${ identifier }:${ pathname }`
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now - entry.windowStart >= windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now })
    return [true, 0]
  }

  entry.count++
  if (entry.count > maxRequests) {
    return [false, Math.ceil((windowMs - (now - entry.windowStart)) / 1000)]
  }
  return [true, 0]
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now - entry.windowStart > 120000) rateLimitStore.delete(key)
    }
  }, 60000)
}

/* ==================== 代理主函数 ==================== */

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const sessionCookieName = process.env.LINUX_DO_CREDIT_SESSION_COOKIE_NAME || 'linux_do_credit_session_id'
  const sessionCookie = request.cookies.get(sessionCookieName)

  /* API 请求：速率限制后放行 */
  if (pathname.startsWith('/api/')) {
    if (shouldRateLimit(pathname)) {
      const identifier = sessionCookie?.value ||
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        'anonymous'

      const [allowed, waitTime] = checkRateLimit(identifier, pathname)
      if (!allowed) {
        return NextResponse.json(
          { error_code: 'RATE_LIMITED', error_msg: `请求过于频繁，请 ${ waitTime } 秒后重试` },
          { status: 429, headers: { 'Retry-After': String(waitTime) } }
        )
      }
    }
    return NextResponse.next()
  }

  /* 页面请求：公共路由放行 */
  const publicRoutes = ['/', '/login', '/callback', '/privacy', '/terms']
  const publicPrefixes = ['/docs/', '/epay/', '/redenvelope/']

  if (publicRoutes.includes(pathname) || publicPrefixes.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname + search)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp)).*)',
  ],
}
