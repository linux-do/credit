# Linux Do Credit Frontend

Modern frontend application for the Linux Do Credit system.

[中文](./README_zh.md) | English

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- pnpm

### Installation

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Run the development server:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal) with your browser to see the result.

## Project Structure

- `app/`: Next.js App Router pages and layouts
- `components/`: Reusable UI components
  - `ui/`: Base UI components (buttons, inputs, etc.)
  - `common/`: Shared business components
- `lib/`: Utility functions and service definitions
- `public/`: Static assets

## Scripts

- `pnpm dev`: Start development server with Turbopack
- `pnpm build`: Build the application for production
- `pnpm start`: Start production server
- `pnpm lint`: Run ESLint
