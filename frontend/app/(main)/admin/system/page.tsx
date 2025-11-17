"use client"

import { useEffect } from "react"
import { SystemConfigs } from "@/components/common/admin/system-configs"
import { ErrorPage } from "@/components/layout/error"
import { LoadingPage } from "@/components/layout/loading"

import { useUser } from "@/contexts/user-context"
import { AdminProvider, useAdmin } from "@/contexts/admin-context"


/* 系统配置页面 */
export default function SystemConfigPage() {
  return (
    <AdminProvider>
      <SystemConfigPageContent />
    </AdminProvider>
  )
}

/* 系统配置页面内容 */
function SystemConfigPageContent() {
  const { user, loading } = useUser()
  const { refetchSystemConfigs } = useAdmin()

  useEffect(() => {
    if (user?.is_admin) {
      refetchSystemConfigs()
    }
  }, [user?.is_admin, refetchSystemConfigs])

  /* 等待用户信息加载完成 */
  if (loading) {
    return <LoadingPage text="系统配置" badgeText="系统" />
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

  return <SystemConfigs />
}

