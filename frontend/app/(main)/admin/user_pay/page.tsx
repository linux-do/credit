"use client"

import { useEffect } from "react"
import { UserPayConfigs } from "@/components/common/admin/user-pay-configs"
import { ErrorPage } from "@/components/layout/error"
import { LoadingPage } from "@/components/layout/loading"

import { useUser } from "@/contexts/user-context"
import { AdminProvider, useAdmin } from "@/contexts/admin-context"


/* 用户支付配置页面 */
export default function UserPayConfigPage() {
  return (
    <AdminProvider>
      <UserPayConfigPageContent />
    </AdminProvider>
  )
}

/* 用户支付配置页面内容 */
function UserPayConfigPageContent() {
  const { user, loading } = useUser()
  const { refetchUserPayConfigs } = useAdmin()

  useEffect(() => {
    if (user?.is_admin) {
      refetchUserPayConfigs()
    }
  }, [user?.is_admin, refetchUserPayConfigs])

  /* 等待用户信息加载完成 */
  if (loading) {
    return <LoadingPage text="支付配置" badgeText="支付" />
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

  return <UserPayConfigs />
}
