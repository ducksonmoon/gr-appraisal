'use client';

import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BRAND_COLORS } from '@/lib/brand';
import { tooltipStyle } from '@/lib/chartTheme';

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title: string;
}

const COLORS = [
  BRAND_COLORS.navy,
  BRAND_COLORS.navyMuted,
  BRAND_COLORS.research,
  BRAND_COLORS.executive,
  BRAND_COLORS.edu,
  '#57534e',
  '#3f6212',
  '#0e7490',
];

export default function PieChart({ data, title }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="dash-card p-5 sm:p-6">
      <h3 className="mb-1 text-base font-bold tracking-tight text-[var(--text)]">{title}</h3>
      <p className="mb-5 text-xs leading-relaxed text-[var(--text-muted)] sm:mb-6">
        سهم هر دانشکده از کل رکوردهای فیلترشده
      </p>
      <div className="flex flex-col items-center gap-6 lg:flex-row">
        <div className="w-full lg:w-2/3">
          <ResponsiveContainer width="100%" height={320}>
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                innerRadius={52}
                fill={BRAND_COLORS.navy}
                dataKey="value"
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke={BRAND_COLORS.surfaceCard}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, 'تعداد']} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full space-y-2 lg:w-1/3">
          {data.map((entry, index) => (
            <div
              key={entry.name}
              className="flex items-center justify-between gap-2 border-b border-[var(--border)] py-1.5 last:border-0"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="truncate text-sm text-[var(--text)]">{entry.name}</span>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--text)]">
                {entry.value}
              </span>
            </div>
          ))}
          <div className="flex justify-between pt-2 text-sm font-semibold text-[var(--text)]">
            <span>جمع</span>
            <span className="tabular-nums">{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
