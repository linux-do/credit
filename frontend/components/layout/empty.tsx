import * as React from "react";
import { FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

/**
 * 空状态展示组件属性
 * 用于统一显示无数据、无内容等空状态
 */
export interface EmptyStateProps extends React.ComponentProps<"div"> {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionText?: string;
  onAction?: () => void;
  iconSize?: "sm" | "md" | "lg";
}

/**
 * 空状态展示组件
 * 用于统一显示无数据、无内容等空状态
 *
 * @example
 * ```tsx
 * // 基础用法
 * <EmptyState
 *   title="暂无数据"
 *   description="当前没有任何记录"
 * />
 *
 * // 带操作按钮
 * <EmptyState
 *   title="暂无交易记录"
 *   description="还没有任何交易"
 *   actionText="创建交易"
 *   onAction={() => router.push('/create')}
 * />
 *
 * // 自定义图标
 * <EmptyState
 *   icon={BarChartIcon}
 *   description="未发现提现记录"
 * />
 * ```
 * @param {EmptyStateProps} props - 空状态展示组件属性
 * @returns {React.ReactNode} 空状态展示组件
 */
export function EmptyState({
  title,
  description,
  icon: Icon = FileTextIcon,
  actionText,
  onAction,
  className,
  iconSize = "md",
}: EmptyStateProps) {
  const iconSizes = { sm: "size-10", md: "size-12", lg: "size-16" };
  const iconInnerSizes = { sm: "size-5", md: "size-6", lg: "size-8" };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div
        className={cn(
          "rounded-full bg-muted flex items-center justify-center mb-4",
          iconSizes[iconSize]
        )}
      >
        <Icon
          className={cn("text-muted-foreground", iconInnerSizes[iconSize])}
        />
      </div>

      {title && <h3 className="text-base font-medium mb-1">{title}</h3>}

      {description && (
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      )}

      {onAction && actionText && (
        <Button onClick={onAction} variant="outline" className="mt-4">
          {actionText}
        </Button>
      )}
    </div>
  );
}

/**
 * 带边框的空状态组件
 * 适合在卡片或容器内使用
 *
 * @example
 * ```tsx
 * <EmptyStateWithBorder
 *   title="暂无数据"
 *   description="当前没有任何记录"
 * />
 * ```
 * @param {EmptyStateProps} props - 空状态展示组件属性
 * @returns {React.ReactNode} 带边框的空状态组件
 */
export function EmptyStateWithBorder(props: EmptyStateProps) {
  return (
    <div className="border border-dashed rounded-lg">
      <EmptyState {...props} />
    </div>
  );
}

/**
 * 简化版空状态组件（内联使用）
 * 适合在较小的区域显示
 *
 * @example
 * ```tsx
 * <EmptyInline
 *   message="暂无数据"
 *   icon={FileTextIcon}
 * />
 * ```
 * @param {Pick<EmptyStateProps, 'icon' | 'className'> & { message?: string }} props - 简化版空状态组件属性
 * @returns {React.ReactNode} 简化版空状态组件
 */
export function EmptyInline({
  message = "暂无数据",
  icon: Icon = FileTextIcon,
  className,
}: Pick<EmptyStateProps, "icon" | "className"> & { message?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground",
        className
      )}
    >
      <Icon className="size-4" />
      <span>{message}</span>
    </div>
  );
}
