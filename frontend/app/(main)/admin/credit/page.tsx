"use client"

import { useEffect } from "react"
import { UserPayConfigs } from "@/components/common/admin/credit"
import { useUser } from "@/contexts/user-context"
import { AdminProvider, useAdmin } from "@/contexts/admin-context"

/* 用户积分配置页面 */
export default function UserPayConfigPage() {
  return (
    <AdminProvider>
      <UserPayConfigPageContent />
    </AdminProvider>
  )
}

/* 用户积分配置页面内容 */
function UserPayConfigPageContent() {
  const { user } = useUser()
  const { refetchUserPayConfigs } = useAdmin()

  useEffect(() => {
    if (user?.is_admin) {
      refetchUserPayConfigs()
    }
  }, [user?.is_admin, refetchUserPayConfigs])

  return <UserPayConfigs />
}
