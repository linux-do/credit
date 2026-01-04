"use client";

import * as React from "react";
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number";
import { BalanceReport } from "@/components/common/balance/balance-report";
import { BalanceSummary } from "@/components/common/balance/balance-summary";
import { BalanceTable } from "@/components/common/balance/balance-table";
import { useUser } from "@/contexts/user-context";

/**
 * 积分余额主页面组件
 *
 * 负责组装积分余额页面的各个子组件,包括积分余额总览、积分余额摘要、近期活动和报告侧边栏
 */
export function BalanceMain() {
  const { user, loading } = useUser();

  /** 计算总余额 */
  const totalBalance = React.useMemo(() => {
    return parseFloat(user?.available_balance || "0");
  }, [user?.available_balance]);

  return (
    <div className="py-6">
      <div className="flex items-center gap-2  pb-2">
        <h1 className="text-3xl">
          <span className="font-semibold">积分</span>
          <span className="pl-2">LDC</span>
          <span className="pl-2">
            {loading ? (
              "-"
            ) : (
              <CountingNumber number={totalBalance} decimalPlaces={2} />
            )}
          </span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
        <div className="lg:col-span-2 space-y-12">
          <section aria-labelledby="balance-summary-title">
            <h2 id="balance-summary-title" className="font-semibold mb-4">
              积分摘要
            </h2>
            <BalanceSummary />
          </section>

          <section aria-labelledby="recent-activity-title">
            <h2 id="recent-activity-title" className="font-semibold mb-2">
              近期活动
            </h2>
            <BalanceTable />
          </section>
        </div>

        <aside className="lg:col-span-1" aria-labelledby="reports-title">
          <BalanceReport />
        </aside>
      </div>
    </div>
  );
}
