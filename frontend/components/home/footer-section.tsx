import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Github, Twitter, Instagram, Linkedin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface FooterSectionProps {
  className?: string;
}

/**
 * Footer Section - 页脚
 * 独立组件，使用 React.memo 优化性能
 * 正常的页脚，不占据整个屏幕
 */
export const FooterSection = React.memo(function FooterSection({ className }: FooterSectionProps) {
  return (
    <footer className={cn("relative z-10 w-full bg-gradient-to-t from-background/95 via-background/80 to-transparent px-6 py-16 snap-start", className)}>
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-16">

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                LD
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">LINUX DO PAY</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              为社区开发者打造的支付基础设施。简单、安全、高效。
            </p>
            <div className="flex gap-4 text-muted-foreground">
              <Github className="w-5 h-5 hover:text-foreground cursor-pointer transition-colors" />
              <Twitter className="w-5 h-5 hover:text-foreground cursor-pointer transition-colors" />
              <Instagram className="w-5 h-5 hover:text-foreground cursor-pointer transition-colors" />
              <Linkedin className="w-5 h-5 hover:text-foreground cursor-pointer transition-colors" />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">产品</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground transition-colors">功能概览</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">定价策略</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">解决方案</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">更新日志</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">公司</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground transition-colors">关于我们</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">加入团队</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">联系方式</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">法律条款</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">订阅更新</h3>
            <p className="text-xs text-muted-foreground">
              订阅我们的最新动态，第一时间获取产品更新信息。
            </p>
            <div className="flex gap-2">
              <Input placeholder="请输入您的邮箱" className="bg-background/50 border-input" />
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                订阅
              </Button>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© 2025 LINUX DO PAY. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <span className="text-red-500">AI</span> by @Chenyme
          </p>
        </div>
      </div>
    </footer>
  );
});
