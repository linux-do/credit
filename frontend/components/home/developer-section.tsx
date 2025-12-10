import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/app/page";

export interface DeveloperSectionProps {
  className?: string;
}

/**
 * Developer Section - 开发者体验展示
 * 独立组件，使用 React.memo 优化性能
 */
export const DeveloperSection = React.memo(function DeveloperSection({ className }: DeveloperSectionProps) {
  return (
    <section className={cn("relative z-10 w-full h-screen flex items-center justify-center px-6 snap-start", className)}>
      <div className="container mx-auto max-w-6xl grid lg:grid-cols-2 gap-8 items-center">

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="order-2 lg:order-1"
        >
          <GlassCard className="p-0 overflow-hidden bg-[#1e1e1e] border-white/10 !bg-[#1e1e1e] transition-none hover:shadow-2xl cursor-default group">
            <div className="flex gap-2 p-3 lg:p-4 border-b border-white/10 bg-white/5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            {/* Code Content */}
            <div className="p-4 lg:p-6 overflow-x-auto">
              <pre className="text-xs lg:text-sm font-mono text-neutral-300 leading-relaxed">
                <code>
                  <span className="text-purple-400">curl</span> <span className="text-green-400">https://pay.linux.do/api/v1/link/create</span> \{'\n'}
                  {'  '}-X <span className="text-yellow-400">POST</span> \{'\n'}
                  {'  '}-H <span className="text-yellow-400">&quot;Authorization: Bearer sk_live_...&quot;</span> \{'\n'}
                  {'  '}-H <span className="text-yellow-400">&quot;Content-Type: application/json&quot;</span> \{'\n'}
                  {'  '}-d <span className="text-blue-400">&apos;{'{'}</span>{'\n'}
                  {'    '}<span className="text-orange-400">&quot;product_name&quot;</span>: <span className="text-green-400">&quot;Premium Pro&quot;</span>,{'\n'}
                  {'    '}<span className="text-orange-400">&quot;amount&quot;</span>: <span className="text-blue-400">100.00</span>{'\n'}
                  {'  '}<span className="text-blue-400">{'}'}&apos;</span>
                </code>
              </pre>
            </div>
          </GlassCard>
        </motion.div>

        <div className="flex flex-col justify-center space-y-8 order-1 lg:order-2">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
              简单直接，<br />
              RESTful API
            </h2>
            <p className="text-muted-foreground max-w-md leading-relaxed mb-8">
              标准化的 HTTP 接口设计，支持任意编程语言。无需复杂的 SDK 集成，直接调用即可快速完成支付功能接入。
            </p>

            <div className="flex gap-4">
              <Link href="/docs/api">
                <Button className="rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium">
                  查看文档
                </Button>
              </Link>
              <Link href="/merchant">
                <Button variant="outline" className="rounded-full px-8 border-none hover:bg-accent text-sm font-medium">
                  获取 API Key
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
});
