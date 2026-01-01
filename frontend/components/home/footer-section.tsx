import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Github, Twitter, Instagram, Linkedin, Send, LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface FooterSectionProps {
  className?: string;
}

/**
 * Footer Section - 页脚
 * 独立组件，使用 React.memo 优化性能
 */
export const FooterSection = React.memo(function FooterSection({ className }: FooterSectionProps) {
  return (
    <footer className={cn("relative z-10 w-full bg-transparent border-t border-white/10 mt-0 backdrop-blur-sm snap-start", className)}>
      <div className="container mx-auto max-w-7xl px-6 py-20 lg:py-32">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">

          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 p-2 rounded bg-primary text-sm text-primary-foreground flex items-center justify-center font-bold">
                LDC
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">LINUX DO Credit</span>
            </Link>
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
              为社区开发者打造的积分处理与委托认证平台。简单、安全、高效，致力于连接全球价值，赋能每一位社区开发者。
            </p>
            <div className="flex gap-4 pt-2">
              <SocialLink icon={Github} href="#" />
              <SocialLink icon={Twitter} href="#" />
              <SocialLink icon={Instagram} href="#" />
              <SocialLink icon={Linkedin} href="#" />
            </div>
          </div>

          <div className="lg:col-span-2 lg:col-start-6">
            <h3 className="font-semibold text-foreground mb-6">产品</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><FooterLink href="#">功能特性</FooterLink></li>
              <li><FooterLink href="#">定价方案</FooterLink></li>
              <li><FooterLink href="#">更新日志</FooterLink></li>
              <li><FooterLink href="/docs/api">API 文档</FooterLink></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-semibold text-foreground mb-6">资源</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><FooterLink href="/docs/newest">最新动态</FooterLink></li>
              <li><FooterLink href="/docs/how-to-use">帮助文档</FooterLink></li>
              <li><FooterLink href="https://linux.do/">社区动态</FooterLink></li>
              <li><FooterLink href="https://github.com/linux-do/credit/">开源贡献</FooterLink></li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="font-semibold text-foreground mb-6">订阅更新</h3>
            <p className="text-sm text-muted-foreground mb-4">
              订阅我们的 Newsletter，第一时间获取产品动态和技术干货。
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="you@example.com"
                  className="bg-muted/50 border-input pr-10 h-10 rounded-lg focus-visible:ring-primary/20"
                />
              </div>
              <Button size="icon" className="h-10 w-10 shrink-0 rounded-lg">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2025 LINUX DO Credit. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="/docs/privacy-policy" className="hover:text-foreground transition-colors">隐私政策</Link>
            <Link href="/docs/terms-of-service" className="hover:text-foreground transition-colors">服务条款</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Cookie设置</Link>
          </div>
        </div>

      </div>

      <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none opacity-[0.02]">
        <div className="text-[15vw] font-black leading-none text-foreground whitespace-nowrap select-none text-center transform translate-y-1/3">
          LINUX DO Credit
        </div>
      </div>
    </footer>
  );
});

function SocialLink({ icon: Icon, href }: { icon: LucideIcon, href: string }) {
  return (
    <Link href={href} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300">
      <Icon className="w-5 h-5" />
    </Link>
  )
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link href={href} className="hover:text-foreground transition-colors flex items-center group">
      <span className="relative">
        {children}
        <span className="absolute left-0 -bottom-0.5 w-0 h-px bg-foreground transition-all duration-300 group-hover:w-full" />
      </span>
    </Link>
  )
}
