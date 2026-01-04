import * as React from "react";

/**
 * 社区积分划转组件
 *
 * 显示社区积分划转规则
 */
export function Community() {
  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg px-6 py-4">
        <div className="max-w-2xl">
          <h2 className="font-semibold mb-3">LINUX DO 社区积分划转规则</h2>
          <div className="text-muted-foreground space-y-2">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                社区积分源于用户在社区内的活动，如发布文章、评论、点赞等。
              </li>
              <li>社区积分无法在每日划转前进行交易、赠予给其他社区用户。</li>
              <li>
                每日划转时间为每日凌晨00:00:00，目前划转无需任何服务手续费。
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
