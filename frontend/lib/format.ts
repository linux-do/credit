export function formatScore(score: string | number): string {
  const num = typeof score === "string" ? parseFloat(score) : score;
  if (isNaN(num)) return "0";
  return num.toLocaleString("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatRank(rank: number): string {
  if (rank <= 0) return "-";
  return `#${rank}`;
}
