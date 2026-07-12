'use client';

import { useMemo } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Evaluation } from '@/types';
import { ACTIVITY_LABELS, emptyActivityTotals, sumActivities } from '@/lib/activities';
import { CHART, tooltipStyle } from '@/lib/chartTheme';

interface ActivityTotalsChartProps {
  evaluations: Evaluation[];
}

export default function ActivityTotalsChart({ evaluations }: ActivityTotalsChartProps) {
  const data = useMemo(() => {
    const totals = emptyActivityTotals();
    for (const e of evaluations) {
      const s = sumActivities(e.activities);
      for (const { key } of ACTIVITY_LABELS) {
        totals[key] += s[key];
      }
    }
    return ACTIVITY_LABELS.map(({ key, label }) => ({
      name: label,
      value: totals[key],
      fullName: label,
    }));
  }, [evaluations]);

  const hasAny = data.some((d) => d.value > 0);
  if (!hasAny) return null;

  return (
    <div className="dash-card p-5 sm:p-6">
      <h3 className="mb-1 text-base font-bold tracking-tight text-[var(--text)]">جمع تعداد فعالیت‌ها به تفکیک نوع</h3>
      <p className="mb-5 text-sm leading-relaxed text-[var(--text-muted)] sm:mb-6">
        اعداد از بخش فعالیت‌های سالانه در هر رکورد (با اعمال فیلتر سال) جمع شده‌اند. امتیازها جداگانه از دادهٔ ورودی می‌آیند.
      </p>
      <ResponsiveContainer width="100%" height={360}>
        <RechartsBarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 70 }} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
          <XAxis dataKey="name" tick={{ fill: CHART.tick, fontSize: 11 }} angle={-28} textAnchor="end" height={72} />
          <YAxis tick={{ fill: CHART.tick, fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, 'تعداد']} labelFormatter={(label) => label} />
          <Bar dataKey="value" fill={CHART.primary} name="تعداد" radius={[0, 2, 2, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
