'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CHART, tooltipStyle } from '@/lib/chartTheme';

interface BarChartProps {
  data: Array<{
    name: string;
    educationalScore: number;
    researchScore: number;
    executiveScore: number;
  }>;
}

export default function BarChart({ data }: BarChartProps) {
  const chartHeight = Math.max(320, Math.min(560, data.length * 28 + 160));
  const shouldRotateLabels = data.length > 10;
  const useVerticalLayout = data.length > 20;

  return (
    <div className="dash-card p-5 sm:p-6">
      <h3 className="mb-1 text-base font-bold tracking-tight text-[var(--text)]">
        مقایسه امتیاز اعضای هیئت علمی
        {data.length >= 40 && (
          <span className="mr-2 text-sm font-normal text-[var(--text-muted)]">
            (نمایش ۴۰ مورد برتر از نظر جمع کل)
          </span>
        )}
      </h3>
      <p className="mb-5 text-xs leading-relaxed text-[var(--text-muted)] sm:mb-6">
        آموزشی، پژوهشی و اجرایی بر اساس رکوردهای فیلترشده
      </p>
      <div className="w-full overflow-x-auto">
        <div style={{ minWidth: useVerticalLayout ? `${data.length * 56}px` : '100%' }}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <RechartsBarChart
              data={data}
              margin={{
                top: 16,
                right: useVerticalLayout ? 120 : 24,
                left: 12,
                bottom: shouldRotateLabels ? 80 : 40,
              }}
              layout={useVerticalLayout ? 'vertical' : 'horizontal'}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              {useVerticalLayout ? (
                <>
                  <XAxis type="number" tick={{ fill: CHART.tick, fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: CHART.tick, fontSize: 11 }} width={120} />
                </>
              ) : (
                <>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: CHART.tick, fontSize: shouldRotateLabels ? 10 : 11 }}
                    angle={shouldRotateLabels ? -35 : 0}
                    textAnchor={shouldRotateLabels ? 'end' : 'middle'}
                    height={shouldRotateLabels ? 80 : 40}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: CHART.tick, fontSize: 11 }}
                    label={{ value: 'امتیاز', angle: -90, position: 'insideLeft', fill: CHART.tick, fontSize: 12 }}
                  />
                </>
              )}
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
              <Bar dataKey="educationalScore" fill={CHART.edu} name="آموزشی" radius={[2, 2, 0, 0]} />
              <Bar dataKey="researchScore" fill={CHART.research} name="پژوهشی" radius={[2, 2, 0, 0]} />
              <Bar dataKey="executiveScore" fill={CHART.executive} name="اجرایی" radius={[2, 2, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
