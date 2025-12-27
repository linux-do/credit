"use client"

import { useEffect } from "react"
import { SystemConfigs } from "@/components/common/admin/system"
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
  const { user } = useUser()
  const { refetchSystemConfigs } = useAdmin()

  useEffect(() => {
    if (user?.is_admin) {
      refetchSystemConfigs()
    }
  }, [user?.is_admin, refetchSystemConfigs])

  return <SystemConfigs />
}

