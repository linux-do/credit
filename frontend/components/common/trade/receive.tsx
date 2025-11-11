"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// 功能卡片组件
function FeatureCard({ 
  title, 
  description, 
  linkText 
}: { 
  title: string
  description: string
  linkText: string
}) {
  return (
    <Card className="bg-background border border-border shadow-none hover:shadow-sm transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        <CardDescription className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </CardDescription>
        <Button variant="link" className="px-0 h-auto text-sm text-blue-600 font-normal hover:text-blue-700">
          {linkText}
        </Button>
      </CardContent>
    </Card>
  )
}

export function Receive() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-16 py-20">
        <div className="max-w-3xl">
          <h2 className="text-5xl font-bold mb-6 text-foreground">开始收款</h2>
          <p className="text-base text-muted-foreground mb-8 leading-relaxed">
            通过无代码选项快速开始使用或探索与我们的 API 集成的可自定义账户界面。
          </p>
          <Button 
            size="lg" 
            className="bg-[#6366f1] hover:bg-[#5558e3] text-white font-medium px-6 h-11 rounded-md shadow-sm"
          >
            开始使用
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard
          title="使用预制的支付表格"
          description="直接在您的网站上嵌入进行转化优化的账户表单，或重定向到 Stripe 托管的页面。"
          linkText="了解有关结账的更多信息"
        />
        <FeatureCard
          title="创建自定义支付用户界面"
          description="通过将我们的嵌入化组件构成，在您的网站和移动端应用程序上接受付款。"
          linkText="进一步了解 账户"
        />
        <FeatureCard
          title="面对面向客户收款"
          description="通过与我们的读卡器集成，并将 Stripe 扩展到您的销售点，以处理线下付款。"
          linkText="了解有关 Terminal 的更多信息"
        />
      </div>
    </div>
  )
}
