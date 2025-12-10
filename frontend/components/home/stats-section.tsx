import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Zap } from "lucide-react";
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number";
import { Button } from "@/components/ui/button";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

export interface StatsSectionProps {
  className?: string;
}

/**
 * Stats Section - 数据统计展示
 * 独立组件，使用 React.memo 优化性能
 */
export const StatsSection = React.memo(function StatsSection({ className }: StatsSectionProps) {
  return (
    <section className={cn("relative z-10 w-full h-screen flex items-center justify-center px-6 snap-start", className)}>
      <div className="container mx-auto max-w-6xl grid lg:grid-cols-2 gap-10 lg:gap-16 item-center">

        <div className="flex flex-col justify-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
              用数据说话，<br />
              见证非凡增长
            </h2>
            <p className="text-muted-foreground max-w-md leading-relaxed mb-8">
              不仅仅是支付工具，更是您业务增长的引擎。实时数据洞察，助您做出明智决策，轻松掌握每一笔交易动态。
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block relative lg:h-64 w-full rounded-3xl overflow-hidden p-2"
          >
            <ChartContainer config={chartConfig} className="w-full h-full">
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" hideLabel />}
                />
                <Area
                  dataKey="desktop"
                  type="natural"
                  fill="var(--color-desktop)"
                  fillOpacity={0.4}
                  stroke="var(--color-desktop)"
                />
              </AreaChart>
            </ChartContainer>
          </motion.div>
        </div>

        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16 text-right lg:text-right text-center"
          >
            <div className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-none tracking-tighter flex justify-end items-end gap-2">
              <CountingNumber
                number={12.3}
                decimalPlaces={1}
                initiallyStable={true}
                inView={true}
                inViewOnce={true}
              /> M
            </div>
            <div className="flex items-center justify-end gap-2 text-muted-foreground mt-2 font-medium">
              <span>仅需一年时间</span>
              <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 bg-muted hover:bg-muted/80">
                <Zap className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-8 lg:gap-y-16">
            {[
              { value: 3000, label: "活跃用户", suffix: "+" },
              { value: 300, label: "业务增长", suffix: "%" },
              { value: 30000, label: "用户规模", suffix: "+" },
              { value: 100, label: "交易规模", suffix: "M+" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                className="text-right lg:text-right text-center"
              >
                <div className="text-4xl md:text-5xl font-semibold text-foreground mb-2 flex justify-end items-center gap-1">
                  <CountingNumber
                    number={stat.value}
                    initiallyStable={true}
                    inView={true}
                    inViewOnce={true}
                  />
                  {stat.suffix}
                </div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
});
