/**
 * 主题系统
 * 统一导出整个主题系统的所有功能
 */

/* 类型定义 */
export type { Theme, ThemeColors, ThemeConfig } from "./types";

/* 配置 */
export { THEME_CONFIG } from "./config";

/* 服务端工具 */
export { getAvailableThemes } from "./parser";

/* 客户端工具 */
export {
  getStoredThemeId,
  setStoredThemeId,
  removeStoredThemeId,
} from "./storage";

/* React 上下文和 Hooks */
export { CustomThemeProvider, useCustomTheme } from "./context";
