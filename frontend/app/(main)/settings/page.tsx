import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UserRound, Bell, Shield, Palette } from "lucide-react"


/* 设置项 */
const settingsItems = [
  {
    title: "个人资料",
    description: "查看和编辑您的个人信息",
    icon: UserRound,
    href: "/settings/profile",
  },
  {
    title: "通知设置",
    description: "管理您的通知偏好",
    icon: Bell,
    href: "/settings/notifications",
  },
  {
    title: "安全设置",
    description: "管理密码和安全选项",
    icon: Shield,
    href: "/settings/security",
  },
  {
    title: "外观设置",
    description: "自定义界面主题和显示",
    icon: Palette,
    href: "/settings/appearance",
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold">设置</h1>
        <p className="text-muted-foreground mt-2">
          管理您的账户设置和偏好
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="border-none hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <item.icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
