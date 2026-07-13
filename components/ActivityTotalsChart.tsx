"use client";

import { useMemo } from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Evaluation } from "@/types";
import {
  ACTIVITY_LABELS,
  emptyActivityTotals,
  sumActivities,
} from "@/lib/activities";
import {
  CHART,
  categoryAxisWidth,
  tooltipStyle,
  truncateChartLabel,
} from "@/lib/chartTheme";

interface ActivityTotalsChartProps {
  evaluations: Evaluation[];
}

export default function ActivityTotalsChart({
  evaluations,
}: ActivityTotalsChartProps) {
  const data = useMemo(() => {
    const totals = emptyActivityTotals();
    for (const e of evaluations) {
      const s = sumActivities(e.activities);
      for (const { key } of ACTIVITY_LABELS) {
        totals[key] += s[key];
      }
    }
    return ACTIVITY_LABELS.map(({ key, label }) => ({
      name: truncateChartLabel(label, 22),
      value: totals[key],
      fullName: label,
    })).filter((d) => d.value > 0);
  }, [evaluations]);

  if (data.length === 0) return null;

  const yWidth = categoryAxisWidth(
    data.map((d) => d.fullName),
    22,
  );
  const height = Math.max(280, data.length * 36 + 48);

  return (
    <div className="dash-card p-5 sm:p-6">
      <h3 className="mb-1 text-base font-bold tracking-tight text-[var(--text)]">
        جمع تعداد فعالیت‌ها به تفکیک نوع
      </h3>
      <p className="mb-5 text-sm leading-relaxed text-[var(--text-muted)] sm:mb-6">
        اعداد از بخش فعالیت‌های سالانه در هر رکورد (با اعمال فیلتر سال) جمع
        شده‌اند. امتیازها جداگانه از دادهٔ ورودی می‌آیند.
      </p>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
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
            formatter={(value: number) => [value, "تعداد"]}
            labelFormatter={(_, payload) =>
              (payload?.[0]?.payload as { fullName?: string } | undefined)
                ?.fullName ?? ""
            }
          />
          <Bar
            dataKey="value"
            fill={CHART.primary}
            name="تعداد"
            radius={[0, 2, 2, 0]}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
