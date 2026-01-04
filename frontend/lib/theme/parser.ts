"use server";

import fs from "fs/promises";
import path from "path";
import type { Theme } from "./types";
import { THEME_CONFIG } from "./config";

/**
 * 从 CSS 片段中解析 CSS 变量
 * @param cssSection - CSS 代码片段
 * @returns CSS 变量键值对映射
 */
function parseCSSVariables(cssSection: string): Record<string, string> {
  const variables: Record<string, string> = {};
  const regex = /--([a-z0-9-]+):\s*([^;]+);/g;

  let match;
  while ((match = regex.exec(cssSection)) !== null) {
    variables[match[1]] = match[2].trim();
  }

  return variables;
}

/**
 * 获取所有可用主题
 * 通过解析 CSS 文件获取主题列表和颜色配置
 * @returns 主题列表，按默认主题优先，其余按名称排序
 */
export async function getAvailableThemes(): Promise<Theme[]> {
  try {
    const styleDir = path.join(process.cwd(), THEME_CONFIG.styleDir);
    const files = await fs.readdir(styleDir);

    const themes = await Promise.all(
      files
        .filter((file) => file.endsWith(".css"))
        .map(async (file) => {
          /* 生成主题名称 */
          const name =
            file === "default.css"
              ? "Default"
              : file
                  .replace(".css", "")
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");

          const content = await fs.readFile(path.join(styleDir, file), "utf-8");

          /* 从 :root 解析明亮模式颜色 */
          const rootSection = content.match(/:root\s*\{([^}]+)\}/s)?.[1] || "";
          const lightColors = parseCSSVariables(rootSection);

          /* 从 .dark 解析暗色模式颜色 */
          const darkSection = content.match(/\.dark\s*\{([^}]+)\}/s)?.[1] || "";
          const darkColors = parseCSSVariables(darkSection);

          return {
            id: file,
            name,
            colors: {
              light: lightColors,
              dark: darkColors,
            },
          };
        })
    );

    /* 默认主题排在最前面，其余按名称排序 */
    return themes.sort((a, b) => {
      if (a.id === "default.css") return -1;
      if (b.id === "default.css") return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error("Failed to parse themes:", error);
    return [];
  }
}
