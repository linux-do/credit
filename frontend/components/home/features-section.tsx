import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Globe, Zap, Shield, Code, Activity, Headphones } from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "全球支付",
    description: "支持全球所有地区，轻松触达全球用户。"
  },
  {
    icon: Zap,
    title: "极速到账",
    description: "收入及时到账，资金快速流转，提升效率。"
  },
  {
    icon: Shield,
    title: "安全加密",
    description: "LINUX DO PAY 安全认证，保障资金安全。"
  },
  {
    icon: Code,
    title: "开发者友好",
    description: "优雅的 API 设计，几行代码即可快速接入。"
  },
  {
    icon: Activity,
    title: "实时数据",
    description: "多维度数据分析看板，实时监控交易状态。"
  },
  {
    icon: Headphones,
    title: "全天候支持",
    description: "7x24 小时专业客服支持，随时解决问题。"
  }
];

export interface FeaturesSectionProps {
  className?: string;
}

/**
 * Features Section - 功能特性展示
 * 独立组件，使用 React.memo 优化性能
 */
export const FeaturesSection = React.memo(function FeaturesSection({ className }: FeaturesSectionProps) {
  return (
    <section className={cn("relative z-10 w-full h-screen flex items-center justify-center px-6 snap-start", className)}>
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
            为什么选择 LINUX DO PAY?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            为现代企业和开发者量身定制的支付解决方案，助您轻松连接全球市场。
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group p-3 lg:p-6 rounded-3xl bg-card border-border transition-all duration-300"
            >
              <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-2xl bg-muted flex items-center justify-center mb-3 lg:mb-6 text-foreground transition-colors duration-300">
                <feature.icon className="w-4 h-4 lg:w-6 lg:h-6" />
              </div>
              <h3 className="text-base lg:text-lg font-bold text-foreground mb-2 lg:mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-xs lg:text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});
