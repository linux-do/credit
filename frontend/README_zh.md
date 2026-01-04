# Linux Do Credit Frontend

Linux Do Credit 系统的现代化前端应用。

[English](./README.md) | 中文

## 技术栈

- **框架**: [Next.js 16](https://nextjs.org/)
- **样式**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI 组件**: [Radix UI](https://www.radix-ui.com/)
- **图标**: [Lucide React](https://lucide.dev/)
- **包管理器**: [pnpm](https://pnpm.io/)

## 快速开始

### 前置要求

- Node.js (建议使用最新的 LTS 版本)
- pnpm

### 安装

1. 安装依赖:

   ```bash
   pnpm install
   ```

2. 运行开发服务器:

   ```bash
   pnpm dev
   ```

   在浏览器中打开 [http://localhost:3000](http://localhost:3000) (或终端中显示的端口) 查看结果。

## 项目结构

- `app/`: Next.js App Router 页面和布局
- `components/`: 可复用 UI 组件
  - `ui/`: 基础 UI 组件 (按钮, 输入框等)
  - `common/`: 共享业务组件
- `lib/`: 工具函数和服务定义
- `public/`: 静态资源

## 脚本

- `pnpm dev`: 启动开发服务器 (使用 Turbopack)
- `pnpm build`: 构建生产版本
- `pnpm start`: 启动生产服务器
- `pnpm lint`: 运行 ESLint
