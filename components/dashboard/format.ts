export const horizons = [1, 3, 5, 10, 20] as const;

export function eventRead(actual: number, expected: number) {
  if (actual > expected) return "高於預期";
  if (actual < expected) return "低於預期";
  return "符合預期";
}

export function trendMark(trend: string, delta = 0) {
  if (trend === "up") return `↑ +${Math.max(1, Math.abs(delta))}`;
  if (trend === "down") return `↓ -${Math.max(1, Math.abs(delta))}`;
  return "→ 0";
}

export function nowLabel(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
