"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useTheme as useNextTheme } from "next-themes";
import type { Theme } from "./types";
import { getStoredThemeId, setStoredThemeId } from "./storage";
import { getAvailableThemes } from "./parser";

/**
 * 主题上下文类型定义
 */
interface ThemeContextValue {
  /** 所有可用主题列表 */
  themes: Theme[];
  /** 当前激活的主题对象 */
  currentTheme: Theme | null;
  /** 当前激活的主题 ID */
  currentThemeId: string | null;
  /** 设置主题的方法 */
  setTheme: (themeId: string) => void;
  /** 是否正在加载主题 */
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * 自定义主题 Hook
 * 必须在 CustomThemeProvider 内部使用
 */
export function useCustomTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useCustomTheme must be used within CustomThemeProvider");
  }
  return context;
}

/**
 * 自定义主题提供者
 * 管理用户选择的界面外观主题（配色方案），独立于明暗模式
 */
export function CustomThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [currentThemeId, setCurrentThemeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useNextTheme();

  /* 加载所有可用主题 */
  useEffect(() => {
    async function loadThemes() {
      const availableThemes = await getAvailableThemes();
      const storedId = getStoredThemeId();

      setThemes(availableThemes);
      setCurrentThemeId(storedId);
      setIsLoading(false);
    }

    loadThemes();
  }, []);

  /* 确保组件已挂载，避免水合不一致 */
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * 将主题颜色应用到 DOM
   * @param theme - 要应用的主题
   * @param isDark - 是否为暗色模式
   */
  const applyThemeColors = useCallback((theme: Theme, isDark: boolean) => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const colors = isDark ? theme.colors.dark : theme.colors.light;

    /* 应用所有 CSS 变量到根元素 */
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }, []);

  /* 当主题 ID 或模式改变时，重新应用颜色 */
  useEffect(() => {
    if (!mounted || !currentThemeId || themes.length === 0) return;

    const theme = themes.find((t) => t.id === currentThemeId);
    if (!theme) return;

    /* 使用 next-themes 的 resolvedTheme，它会自动处理系统偏好 */
    const isDark = resolvedTheme === "dark";
    applyThemeColors(theme, isDark);
  }, [currentThemeId, resolvedTheme, themes, mounted, applyThemeColors]);

  /**
   * 设置主题
   * @param themeId - 要设置的主题 ID
   */
  const setTheme = useCallback(
    (themeId: string) => {
      const theme = themes.find((t) => t.id === themeId);
      if (!theme) return;

      setCurrentThemeId(themeId);
      setStoredThemeId(themeId);

      /* 根据当前解析的主题模式计算是否为暗色 */
      const isDark = resolvedTheme === "dark";
      applyThemeColors(theme, isDark);
    },
    [themes, resolvedTheme, applyThemeColors]
  );

  const currentTheme = themes.find((t) => t.id === currentThemeId) || null;

  return (
    <ThemeContext.Provider
      value={{
        themes,
        currentTheme,
        currentThemeId,
        setTheme,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
