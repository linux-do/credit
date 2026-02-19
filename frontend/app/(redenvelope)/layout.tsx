/**
 * 红包页面布局
 * 提供简洁的布局，不包含侧边栏和用户上下文
 * 允许未登录用户访问红包详情
 */
export default function RedEnvelopeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  )
}