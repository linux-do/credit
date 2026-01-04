"use client";

import { THEME_CONFIG } from "./config";

/**
 * 客户端主题存储工具
 * 用于在 localStorage 中保存和读取用户的主题偏好
 */

/**
 * 获取存储的主题 ID
 */
export function getStoredThemeId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(THEME_CONFIG.storageKey);
}

/**
 * 保存主题 ID 到本地存储
 */
export function setStoredThemeId(themeId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_CONFIG.storageKey, themeId);
}

/**
 * 移除存储的主题 ID
 */
export function removeStoredThemeId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(THEME_CONFIG.storageKey);
}
