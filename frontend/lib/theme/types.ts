/**
 * 主题系统类型定义
 */

/**
 * 主题颜色配置
 * 包含明亮和暗色两种模式的 CSS 变量映射
 */
export interface ThemeColors {
  light: Record<string, string>;
  dark: Record<string, string>;
}

/**
 * 主题定义
 */
export interface Theme {
  /** 主题唯一标识符（CSS 文件名） */
  id: string;
  /** 主题显示名称 */
  name: string;
  /** 主题颜色配置 */
  colors: ThemeColors;
}

/**
 * 主题系统配置
 */
export interface ThemeConfig {
  /** CSS 样式文件所在目录 */
  styleDir: string;
  /** 主题 ID 在 localStorage 中的存储键名 */
  storageKey: string;
}
