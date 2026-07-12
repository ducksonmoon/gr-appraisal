'use client';

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface LineChartProps {
  data: Array<{
    name: string;
    totalScore: number;
    educationalScore: number;
    researchScore: number;
    executiveScore: number;
  }>;
}

const GRID = '#d6d3d1';
const TICK = '#57534e';
const TOOLTIP_BG = '#fafaf9';
const TOOLTIP_BORDER = '#d6d3d1';

export default function LineChart({ data }: LineChartProps) {
  const chartHeight = Math.max(400, Math.min(800, data.length * 25 + 200));
  const shouldRotateLabels = data.length > 10;

  return (
    <div className="dash-card p-5 sm:p-6">
      <h3 className="mb-1 text-base font-bold tracking-tight text-stone-900">روند امتیازها در فهرست فعلی</h3>
      <p className="mb-5 text-xs leading-relaxed text-stone-600 sm:mb-6">جمع کل و سه جزء، مرتب‌شده برای مقایسهٔ نسبی</p>
      <div className="w-full overflow-x-auto">
        <div style={{ minWidth: data.length > 15 ? `${data.length * 60}px` : '100%' }}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <RechartsLineChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: shouldRotateLabels ? 120 : 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis
                dataKey="name"
                tick={{ fill: TICK, fontSize: shouldRotateLabels ? 11 : 12 }}
                angle={shouldRotateLabels ? -45 : 0}
                textAnchor={shouldRotateLabels ? 'end' : 'middle'}
                height={shouldRotateLabels ? 120 : 60}
                interval={data.length > 20 ? Math.floor(data.length / 15) : 0}
              />
              <YAxis
                tick={{ fill: TICK, fontSize: 11 }}
                label={{ value: 'امتیاز', angle: -90, position: 'insideLeft', fill: TICK, fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: TOOLTIP_BG,
                  border: `1px solid ${TOOLTIP_BORDER}`,
                  borderRadius: '6px',
                  direction: 'rtl',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="totalScore"
                stroke="#1e1b4b"
                strokeWidth={2}
                name="جمع کل"
                dot={{ r: data.length > 20 ? 3 : 4 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="educationalScore"
                stroke="#3730a3"
                strokeWidth={2}
                name="آموزشی"
                dot={{ r: data.length > 20 ? 3 : 4 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="researchScore"
                stroke="#0f766e"
                strokeWidth={2}
                name="پژوهشی"
                dot={{ r: data.length > 20 ? 3 : 4 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="executiveScore"
                stroke="#9a3412"
                strokeWidth={2}
                name="اجرایی"
                dot={{ r: data.length > 20 ? 3 : 4 }}
                activeDot={{ r: 5 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
