import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * 功能卡片组件
 */
function FeatureCard({
  title,
  description,
  linkText,
  href,
}: {
  title: string;
  description: string;
  linkText: string;
  href?: string;
}) {
  return (
    <Card className="bg-background border border-border shadow-none transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold -mb-4">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </CardDescription>
        {href ? (
          <Link href={href}>
            <Button
              variant="link"
              className="px-0 h-auto text-xs text-blue-600 font-normal hover:text-blue-700"
            >
              {linkText}
            </Button>
          </Link>
        ) : (
          <Button
            variant="link"
            className="px-0 h-auto text-xs text-muted-foreground font-normal cursor-not-allowed"
            disabled
          >
            {linkText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 积分收益组件
 *
 * 显示积分收益功能和规则
 */
export function Receive() {
  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg px-6 py-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-4 text-foreground">
            获得积分收益
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            通过无代码选项快速开始探索或使用与我们的 API
            集成的可自定义积分服务。
          </p>
          <Button className="bg-primary hover:bg-primary/90 font-medium px-6 rounded-md shadow-sm">
            开始使用
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard
          title="接入官方 API 接口"
          description="使用官方 API 接口（兼容易支付），快速接入积分服务，支持异步通知和同步跳转。"
          linkText="查看文档"
          href="/docs/api"
        />
        <FeatureCard
          title="创建在线积分服务"
          description="通过我们提供的在线积分服务页面，快速创建，无需编写代码即可开始进行积分流转。"
          linkText="前往集市"
          href="/merchant"
        />
        <FeatureCard
          title="面对面服务"
          description="通过 LINUX DO Credit 提供的面对面服务功能，扩展您的积分收益渠道，处理面对面服务场景。"
          linkText="功能开发中，敬请期待"
        />
      </div>
    </div>
  );
}
