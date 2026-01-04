import * as React from "react";
import { ArrowRightLeft, TrendingDown, TrendingUp, Users } from "lucide-react";
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number";
import { useUser } from "@/contexts/user-context";

/**
 * 安全转换数字，避免 NaN
 */
function safeNumber(value: number): number {
  return typeof value === "number" && !isNaN(value) ? value : 0;
}

/**
 * 所有活动组件
 * 显示用户的所有活动统计数据
 */
export function AllActivity() {
  const { user, loading } = useUser();

  /* 统计数据 */
  const stats = React.useMemo(
    () => ({
      totalReceive: parseFloat(user?.total_receive || "0"),
      totalPayment: parseFloat(user?.total_payment || "0"),
      totalTransfer: parseFloat(user?.total_transfer || "0"),
      totalCommunity: parseFloat(user?.total_community || "0"),
    }),
    [user]
  );

  /* 功能卡片配置 */
  const statCards = React.useMemo(
    () => [
      {
        title: "总收益",
        value: stats.totalReceive,
        icon: TrendingUp,
        color: "text-green-600",
        bgColor: "bg-green-100 dark:bg-green-900/20",
      },
      {
        title: "总消耗",
        value: stats.totalPayment,
        icon: TrendingDown,
        color: "text-red-600",
        bgColor: "bg-red-100 dark:bg-red-900/20",
      },
      {
        title: "总转移",
        value: stats.totalTransfer,
        icon: ArrowRightLeft,
        color: "text-blue-600",
        bgColor: "bg-blue-100 dark:bg-blue-900/20",
      },
      {
        title: "总划转",
        value: stats.totalCommunity,
        icon: Users,
        color: "text-purple-600",
        bgColor: "bg-purple-100 dark:bg-purple-900/20",
      },
    ],
    [stats]
  );

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">数据概览</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div key={card.title} className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">
                  {card.title}
                </div>
                <div className={`p-1.5 rounded-full ${card.bgColor}`}>
                  <IconComponent className={`h-3 w-3 ${card.color}`} />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold mt-2">
                {loading ? (
                  "-"
                ) : (
                  <CountingNumber
                    number={safeNumber(card.value)}
                    decimalPlaces={2}
                    initiallyStable={true}
                    inView={true}
                    inViewOnce={true}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
