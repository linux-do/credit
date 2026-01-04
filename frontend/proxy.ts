import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 在渲染页面之前通过会话 cookie 执行快速身份验证检查
 *
 * 流程：
 * 1. 检查路由是否受保护
 * 2. 检查会话 cookie 是否存在
 * 3. 受保护路由上没有 cookie → 立即重定向到 /login
 * 4. 有 cookie → 允许通过（UserProvider 将获取用户信息）
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const sessionCookieName =
    process.env.LINUX_DO_CREDIT_SESSION_COOKIE_NAME ||
    "linux_do_credit_session_id";
  const sessionCookie = request.cookies.get(sessionCookieName);

  /* 定义公共路由 */
  const publicRoutes = ["/", "/login", "/callback", "/privacy", "/terms"];

  /* 定义公共路径前缀 */
  const publicPrefixes = [
    "/docs/", // 文档页面
    "/epay/", // 易支付 API 兼容接口
  ];

  /* 检查当前路径是否为公共路径 */
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!sessionCookie) {
    const callbackUrl = pathname + search;
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", callbackUrl);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * 配置代理应在哪些路由上运行
 *
 * 使用 negative lookahead 排除不需要代理的路径：
 * - _next/* (Next.js 内部资源，包括 webpack-hmr WebSocket、static、image 等)
 * - api/* (API 路由)
 * - favicon.ico, robots.txt, sitemap.xml (元数据文件)
 * - 静态资源文件（图片等）
 */
export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp)).*)",
  ],
};
