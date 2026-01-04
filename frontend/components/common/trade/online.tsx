import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * 积分流转服务组件
 *
 * 显示积分流转服务功能和管理入口
 */
export function Online() {
  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg px-6 py-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-4 text-foreground">
            在线积分流转
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            创建和管理您的在线积分流转服务，无需编写代码即可快速开启个人服务。
          </p>
          <Link href="/merchant/online-paying">
            <Button className="bg-primary hover:bg-primary/90 font-medium px-6 rounded-md shadow-sm">
              前往创建
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
