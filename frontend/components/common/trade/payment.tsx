import * as React from "react";

/**
 * 积分消耗组件
 *
 * 显示积分消耗功能和规则
 */
export function Payment() {
  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg px-6 py-4">
        <div className="max-w-2xl">
          <h2 className="font-semibold mb-3">积分消耗</h2>
          <div className="text-muted-foreground space-y-2">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>安全可靠的认证流程，确保您的账户安全。</li>
              <li>实时积分消耗状态跟踪，随时了解消耗进展。</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
