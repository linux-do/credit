import Link from "next/link";
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { UserRound, Bell, Shield, Palette } from "lucide-react";

/* 设置项 */
const settingsItems = [
  {
    title: "个人资料",
    description: "查看您的账户信息",
    icon: UserRound,
    href: "/settings/profile",
    category: "个人设置",
  },
  {
    title: "通知设置",
    description: "设置您的通知偏好",
    icon: Bell,
    href: "/settings/notifications",
    category: "账户设置",
  },
  {
    title: "安全设置",
    description: "管理您的账户安全",
    icon: Shield,
    href: "/settings/security",
    category: "账户设置",
  },
  {
    title: "外观设置",
    description: "自定义界面主题和显示",
    icon: Palette,
    href: "/settings/appearance",
    category: "个人设置",
  },
];

export default function SettingsPage() {
  const groupedSettings = settingsItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, typeof settingsItems>
  );

  return (
    <div className="space-y-6 py-6">
      <div className="font-semibold">设置</div>

      {Object.entries(groupedSettings).map(([category, items]) => (
        <div key={category} className="space-y-4">
          <div className="font-medium text-sm text-muted-foreground">
            {category}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {items.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="py-2 border border-dashed shadow-none hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <item.icon className="size-5 text-primary" />
                      <div>
                        <CardTitle className="mb-1 text-sm">
                          {item.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {item.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
