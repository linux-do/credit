/**
 * 圣诞节主题装饰组件归档
 * 包含圣诞树、圣诞帽图标以及下雪效果的集成组件
 *
 * 使用示例：
 * ```tsx
 * import { ChristmasDecorations } from "@/components/layout/avater-style/Christmas"
 *
 * function MyComponent() {
 *   const [showChristmas, setShowChristmas] = useState(false)
 *
 *   return (
 *     <>
 *       {showChristmas && <ChristmasDecorations.SnowEffect />}
 *       <div onClick={() => setShowChristmas(!showChristmas)}>
 *         <ChristmasDecorations.Hat className="w-8 h-8" />
 *         <ChristmasDecorations.Tree
 *           className="w-12 h-12"
 *           show={showChristmas}
 *         />
 *       </div>
 *     </>
 *   )
 * }
 * ```
 */

import { cn } from "@/lib/utils";
import { SnowEffect } from "@/components/ui/snow-effect";

/**
 * 圣诞树图标组件
 */
export const ChristmasTree = ({
  className,
  show = true,
}: {
  className?: string;
  show?: boolean;
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn(
      "transition-all duration-500 ease-out",
      show
        ? "opacity-90 scale-100 translate-y-0"
        : "opacity-0 scale-50 translate-y-4",
      className
    )}
  >
    <rect x="10" y="18" width="4" height="4" fill="#92400E" rx="0.5" />
    <path d="M12 4L8 9H16L12 4Z" fill="#15803D" />
    <path d="M12 8L7 14H17L12 8Z" fill="#16A34A" />
    <path d="M12 12L6 19H18L12 12Z" fill="#22C55E" />
    <circle cx="10" cy="10" r="0.8" fill="#EF4444" />
    <circle cx="14" cy="11" r="0.8" fill="#F59E0B" />
    <circle cx="9" cy="15" r="0.8" fill="#3B82F6" />
    <circle cx="15" cy="16" r="0.8" fill="#EF4444" />
    <circle cx="12" cy="14" r="0.8" fill="#F59E0B" />
    <path
      d="M12 2L12.5 3.5L14 4L12.5 4.5L12 6L11.5 4.5L10 4L11.5 3.5L12 2Z"
      fill="#FBBF24"
    />
  </svg>
);

/**
 * 圣诞帽图标组件
 */
export const ChristmasHat = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 3C12 3 5 10 5 15C5 17.5 7 19 8 19H16C17 19 19 17.5 19 15C19 10 12 3 12 3Z"
      fill="#EF4444"
      stroke="#B91C1C"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="3"
      r="2.5"
      fill="white"
      stroke="#E5E7EB"
      strokeWidth="1.5"
    />
    <rect
      x="4"
      y="16"
      width="16"
      height="5"
      rx="2.5"
      fill="white"
      stroke="#E5E7EB"
      strokeWidth="1.5"
    />
  </svg>
);

/**
 * 圣诞节装饰集合
 * 包含所有圣诞节主题组件的命名空间
 */
export const ChristmasDecorations = {
  Tree: ChristmasTree,
  Hat: ChristmasHat,
  SnowEffect: SnowEffect,
};

export default ChristmasDecorations;
