import { BRAND_COLORS } from "@/lib/brand";

export const CHART = {
  grid: "#d6d3d1",
  tick: "#57534e",
  tooltipBg: "#faf9f7",
  tooltipBorder: "#c9c5bc",
  edu: BRAND_COLORS.edu,
  research: BRAND_COLORS.research,
  executive: BRAND_COLORS.executive,
  total: BRAND_COLORS.total,
  primary: BRAND_COLORS.navy,
  secondary: BRAND_COLORS.navyMuted,
} as const;

export const tooltipStyle = {
  backgroundColor: CHART.tooltipBg,
  border: `1px solid ${CHART.tooltipBorder}`,
  borderRadius: "4px",
  direction: "rtl" as const,
  fontSize: "12px",
};

/** Short upright label for axes; full text belongs in tooltip via fullName. */
export function truncateChartLabel(label: string, maxChars = 18): string {
  const t = label.trim();
  if (t.length <= maxChars) return t;
  return `${t.slice(0, Math.max(1, maxChars - 1))}…`;
}

/** Y-axis width for category labels (RTL-friendly, no rotation). */
export function categoryAxisWidth(labels: string[], maxChars = 18): number {
  const longest = labels.reduce(
    (m, s) => Math.max(m, Math.min(s.length, maxChars)),
    4,
  );
  return Math.min(200, Math.max(88, longest * 9 + 16));
}
