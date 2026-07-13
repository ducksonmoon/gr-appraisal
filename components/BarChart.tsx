"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  CHART,
  categoryAxisWidth,
  tooltipStyle,
  truncateChartLabel,
} from "@/lib/chartTheme";

interface BarChartProps {
  data: Array<{
    name: string;
    educationalScore: number;
    researchScore: number;
    executiveScore: number;
  }>;
}

export default function BarChart({ data }: BarChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    fullName: d.name,
    name: truncateChartLabel(d.name, 16),
  }));
  const chartHeight = Math.max(280, Math.min(640, chartData.length * 34 + 72));
  const yWidth = categoryAxisWidth(
    chartData.map((d) => d.fullName),
    16,
  );

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
      <ResponsiveContainer width="100%" height={chartHeight}>
        <RechartsBarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 20, left: 8, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART.grid}
            horizontal={false}
          />
          <XAxis type="number" tick={{ fill: CHART.tick, fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={yWidth}
            tick={{ fill: CHART.tick, fontSize: 11 }}
            interval={0}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(_, payload) =>
              (payload?.[0]?.payload as { fullName?: string } | undefined)
                ?.fullName ?? ""
            }
          />
          <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "12px" }} />
          <Bar
            dataKey="educationalScore"
            fill={CHART.edu}
            name="آموزشی"
            radius={[0, 2, 2, 0]}
          />
          <Bar
            dataKey="researchScore"
            fill={CHART.research}
            name="پژوهشی"
            radius={[0, 2, 2, 0]}
          />
          <Bar
            dataKey="executiveScore"
            fill={CHART.executive}
            name="اجرایی"
            radius={[0, 2, 2, 0]}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
