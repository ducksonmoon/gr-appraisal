import { BRAND_COLORS } from '@/lib/brand';

export const CHART = {
  grid: '#d6d3d1',
  tick: '#57534e',
  tooltipBg: '#faf9f7',
  tooltipBorder: '#c9c5bc',
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
  borderRadius: '4px',
  direction: 'rtl' as const,
  fontSize: '12px',
};
