import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Zap, Shield, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface HeroSectionProps {
  className?: string;
}

/**
 * Hero Section - 主页首屏
 * 独立组件，使用 React.memo 优化性能
 */
export const HeroSection = React.memo(function HeroSection({ className }: HeroSectionProps) {
  return (
    <section className={cn("relative z-10 w-full h-screen flex flex-col justify-center px-6 snap-start", className)}>
      <div className="container mx-auto max-w-5xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

        <div className="max-w-2xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6"
            style={{ letterSpacing: "-0.06em", lineHeight: 1 }}
          >
            LINUX DO PAY <br />
            <span className="text-muted-foreground text-2xl md:text-4xl lg:text-5xl">开启社区支付的新未来。</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-6"
          >
            <Link href="/login">
              <Button
                className="px-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-transform active:scale-95"
              >
                立即开始
              </Button>
            </Link>

            <Link
              href="/about"
              className="group flex items-center text-sm gap-1 text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              探索权益
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="absolute bottom-12 flex flex-wrap gap-8 text-sm font-medium text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>快速到账</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>全球覆盖</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>安全加密</span>
            </div>
          </motion.div>
        </div>

        <div className="hidden lg:flex justify-end relative">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="bg-neutral-900 text-white p-5 rounded-xl shadow-2xl max-w-xs w-80 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2 items-center">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-sm font-medium text-neutral-200">
                    LINUX DO PAY
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-neutral-400">Received</p>
                <p className="text-2xl font-bold tracking-tight">LDC 1,000.00</p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-neutral-500">
                <span>刚刚</span>
                <span>•••• •••• •••• ••••</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});
