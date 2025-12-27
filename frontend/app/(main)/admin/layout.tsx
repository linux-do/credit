"use client"

import { AdminUsersProvider } from "@/contexts/admin-users-context"
import { useUser } from "@/contexts/user-context"
import { LoadingPage } from "@/components/layout/loading"
import { ErrorPage } from "@/components/layout/error"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useUser()

  /* 等待用户信息加载完成 */
  if (loading) {
    return <LoadingPage text="管理后台" badgeText="管理" />
  }

  /* 权限检查：只有管理员才能访问 */
  if (!user?.is_admin) {
    return (
      <ErrorPage
        title="访问被拒绝"
        message="您没有权限访问此页面"
      />
    )
  }

  return (
    <AdminUsersProvider>
      {children}
    </AdminUsersProvider>
  )
}
