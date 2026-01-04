import * as React from "react";

/**
 * 余额报告组件
 *
 * 显示可下载或查看的报告列表
 */
export function BalanceReport() {
  return (
    <section className="space-y-4" aria-labelledby="reports-title">
      <h2 id="reports-title" className="font-semibold">
        报告
      </h2>
      <div className="text-sm text-muted-foreground">暂无报告</div>
    </section>
  );
}
