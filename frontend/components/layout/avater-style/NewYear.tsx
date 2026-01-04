/**
 * 元旦/新年主题装饰组件归档
 * 包含灯笼、福字以及烟花效果的集成组件
 *
 * 使用示例：
 * ```tsx
 * import { NewYearDecorations } from "@/components/layout/avater-style/NewYear"
 *
 * function MyComponent() {
 *   const [showNewYear, setShowNewYear] = useState(false)
 *
 *   return (
 *     <>
 *       {showNewYear && <NewYearDecorations.FireworksEffect />}
 *       <div onClick={() => setShowNewYear(!showNewYear)}>
 *         <NewYearDecorations.Lantern className="w-8 h-8" />
 *         <NewYearDecorations.Fu
 *           className="w-12 h-12"
 *           show={showNewYear}
 *         />
 *       </div>
 *     </>
 *   )
 * }
 * ```
 */

import { cn } from "@/lib/utils";
import { FireworksEffect } from "@/components/ui/fireworks-effect";

/**
 * 红灯笼组件 - 默认头像装饰
 */
export const Lantern = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 1024 1024"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M512 80V160"
      stroke="#FFD700"
      strokeWidth="32"
      strokeLinecap="round"
    />

    <ellipse cx="512" cy="420" rx="300" ry="260" fill="#D92424" />
    <ellipse
      cx="512"
      cy="420"
      rx="300"
      ry="260"
      stroke="#961C1C"
      strokeWidth="10"
    />

    <path
      d="M340 180H684C700 180 712 192 712 208V220H312V208C312 192 324 180 340 180Z"
      fill="#FFD700"
    />
    <path
      d="M340 620H684C700 620 712 632 712 648V660H312V648C312 632 324 620 340 620Z"
      fill="#FFD700"
    />

    <path
      d="M512 160C512 160 620 250 620 420C620 590 512 680 512 680"
      stroke="#FFD700"
      strokeWidth="20"
      strokeLinecap="round"
      strokeOpacity="0.4"
    />
    <path
      d="M512 160C512 160 404 250 404 420C404 590 512 680 512 680"
      stroke="#FFD700"
      strokeWidth="20"
      strokeLinecap="round"
      strokeOpacity="0.4"
    />
    <path
      d="M512 160V680"
      stroke="#FFD700"
      strokeWidth="20"
      strokeOpacity="0.4"
    />

    <circle cx="512" cy="420" r="80" fill="#FFD700" fillOpacity="0.9" />
    <text
      x="512"
      y="450"
      fontSize="80"
      fill="#D92424"
      textAnchor="middle"
      fontWeight="bold"
      fontFamily="serif"
    >
      福
    </text>

    <path d="M512 660V720" stroke="#FFD700" strokeWidth="20" />
    <path
      d="M480 720H544"
      stroke="#D92424"
      strokeWidth="40"
      strokeLinecap="round"
    />

    <path
      d="M492 740V900"
      stroke="#D92424"
      strokeWidth="16"
      strokeLinecap="round"
    />
    <path
      d="M512 740V940"
      stroke="#D92424"
      strokeWidth="16"
      strokeLinecap="round"
    />
    <path
      d="M532 740V900"
      stroke="#D92424"
      strokeWidth="16"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * "福"字挂件 - 点击出现的装饰
 * 一个菱形的福字牌，使用文字渲染确保准确
 */
export const FuCharacter = ({
  className,
  show = true,
}: {
  className?: string;
  show?: boolean;
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn(
      "transition-all duration-500 ease-out origin-center",
      show
        ? "opacity-100 scale-100 rotate-0"
        : "opacity-0 scale-50 rotate-[-15deg]",
      className
    )}
  >
    <path d="M50 0V15" stroke="#F59E0B" strokeWidth="2" />
    <g transform="rotate(25 50 50)">
      <rect
        x="20"
        y="20"
        width="60"
        height="60"
        rx="2"
        fill="#D92424"
        stroke="#F59E0B"
        strokeWidth="1.5"
      />
      <rect
        x="23"
        y="23"
        width="54"
        height="54"
        rx="1"
        stroke="#F59E0B"
        strokeWidth="1"
        strokeOpacity="0.5"
        strokeDasharray="4 2"
        fill="none"
      />

      <text
        x="50"
        y="60"
        fontSize="32"
        fill="#FFD700"
        textAnchor="middle"
        fontWeight="bold"
        fontFamily="'YouYuan', 'Yuanti SC', 'STYuanti', 'HanyiYuanti', 'Comic Sans MS', sans-serif"
        style={{ letterSpacing: "0px" }}
        transform="rotate(130 50 50)"
      >
        福
      </text>
    </g>

    <path d="M50 85V95" stroke="#D92424" strokeWidth="3" />
    <circle cx="50" cy="95" r="2" fill="#F59E0B" />
    <path d="M50 95L47 100M50 95L53 100" stroke="#D92424" strokeWidth="1" />
  </svg>
);

/**
 * 元旦/新年装饰集合
 */
export const NewYearDecorations = {
  Lantern,
  Fu: FuCharacter,
  FireworksEffect,
};

export default NewYearDecorations;
