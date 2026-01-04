import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Github, LucideIcon } from "lucide-react";

export interface FooterSectionProps {
  className?: string;
}

/**
 * Footer Section - 页脚
 */
export const FooterSection = React.memo(function FooterSection({ className }: FooterSectionProps) {
  return (
    <footer className={cn("relative z-10 w-full bg-transparent border-t border-white/10 mt-0 backdrop-blur-sm", className)}>
      <div className="container mx-auto max-w-7xl px-6 py-20 lg:py-32">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-20">

          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 p-2 rounded bg-primary text-sm text-primary-foreground flex items-center justify-center font-bold">
                LDC
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">LINUX DO Credit</span>
            </Link>
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
              专为 LINUX DO 社区打造的积分服务基础服务设施，快速集成、全球覆盖、安全可靠，致力于打造积分生态，助您轻松流通积分。
            </p>
            <div className="flex gap-4 pt-2">
              <SocialLink icon={Github} href="https://github.com/linux-do/credit/" />
            </div>
          </div>

          <div className="lg:col-span-1">
            <h3 className="font-semibold text-foreground mb-6">动态</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><FooterLink href="https://github.com/linux-do/credit/commits/master/">更新日志</FooterLink></li>
              <li><FooterLink href="https://github.com/linux-do/credit/graphs/contributors">开源贡献</FooterLink></li>
              <li><FooterLink href="http://github.com/linux-do/credit/releases">发行版本</FooterLink></li>
            </ul>
          </div>

          <div className="lg:col-span-1">
            <h3 className="font-semibold text-foreground mb-6">资源</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><FooterLink href="/docs/how-to-use">使用文档</FooterLink></li>
              <li><FooterLink href="/docs/api">API 文档</FooterLink></li>
              <li><FooterLink href="https://linux.do/t/topic/1365853">积分脚本</FooterLink></li>
            </ul>
          </div>

          <div className="lg:col-span-1">
            <h3 className="font-semibold text-foreground mb-6">友链</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><FooterLink href="https://linux.do/">LINUX DO</FooterLink></li>
              <li><FooterLink href="https://wiki.linux.do/">LINUX DO Wiki</FooterLink></li>
              <li><FooterLink href="https://cdk.linux.do/">LINUX DO CDK</FooterLink></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2026 LINUX DO Credit. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="/docs/privacy-policy" className="hover:text-foreground transition-colors">隐私政策</Link>
            <Link href="/docs/terms-of-service" className="hover:text-foreground transition-colors">服务条款</Link>
          </div>
        </div>

      </div>

      <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none opacity-[0.02]">
        <div className="text-[12vw] 2xl:text-[180px] font-black leading-none text-foreground whitespace-nowrap select-none text-center transform translate-y-1/3 transition-all duration-700">
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
