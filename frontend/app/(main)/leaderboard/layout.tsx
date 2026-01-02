import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "排行榜 | LINUX DO Credit",
  description: "查看 LINUX DO Credit 平台用户积分排行榜",
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
