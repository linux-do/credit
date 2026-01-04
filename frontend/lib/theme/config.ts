import type { ThemeConfig } from "./types";

/**
 * 主题系统配置
 * 定义主题文件的存储位置和 localStorage 键名
 */
export const THEME_CONFIG: ThemeConfig = {
  styleDir: "public/style",
  storageKey: "app-theme-id",
};
