"use client";

import { useMemo } from "react";
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
import type { Evaluation } from "@/types";
import {
  ACTIVITY_LABELS,
  memberDisplayLabel,
  sumActivities,
} from "@/lib/activities";
import {
  CHART,
  categoryAxisWidth,
  tooltipStyle,
  truncateChartLabel,
} from "@/lib/chartTheme";

interface ProfessorComparisonProps {
  evaluations: Evaluation[];
}

export default function ProfessorComparison({
  evaluations,
}: ProfessorComparisonProps) {
  const chartData = useMemo(
    () =>
      [...evaluations]
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((e) => ({
          name: truncateChartLabel(e.facultyName, 16),
          fullName: memberDisplayLabel(e),
          educationalScore: e.educationalScore,
          researchScore: e.researchScore,
          executiveScore: e.executiveScore,
          totalScore: e.totalScore,
        })),
    [evaluations],
  );

  const tableRows = useMemo(
    () =>
      [...evaluations]
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((e) => ({
          key: e.id ?? memberDisplayLabel(e),
          label: memberDisplayLabel(e),
          faculty: e.faculty,
          educationalScore: e.educationalScore,
          researchScore: e.researchScore,
          executiveScore: e.executiveScore,
          totalScore: e.totalScore,
          activities: sumActivities(e.activities),
        })),
    [evaluations],
  );

  const yWidth = categoryAxisWidth(
    chartData.map((d) => d.fullName),
    16,
  );

  if (evaluations.length < 2) return null;

  return (
    <div className="space-y-5">
      <div className="dash-card p-5 sm:p-6">
        <h3 className="mb-1 text-base font-bold tracking-tight text-[var(--text)]">
          مقایسهٔ اعضای هیئت علمی — امتیازها
        </h3>
        <p className="mb-5 text-xs leading-relaxed text-[var(--text-muted)] sm:mb-6">
          {evaluations.length} عضو انتخاب‌شده؛ امتیازها از دادهٔ ورودی هستند.
        </p>
        <ResponsiveContainer
          width="100%"
          height={Math.max(280, evaluations.length * 36 + 72)}
        >
          <RechartsBarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
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
            <Legend wrapperStyle={{ paddingTop: "8px" }} />
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
            <Bar
              dataKey="totalScore"
              fill={CHART.total}
              name="جمع کل"
              radius={[0, 2, 2, 0]}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>

      <div className="dash-card overflow-hidden p-0">
        <div className="border-b border-stone-300/80 px-5 py-4 sm:px-6">
          <h3 className="text-base font-bold tracking-tight text-[var(--text)]">
            جدول مقایسهٔ امتیاز و فعالیت
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            فعالیت‌ها بر اساس سال‌های فیلترشده جمع شده‌اند.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm" dir="rtl">
            <thead className="bg-stone-200/60 text-xs font-semibold text-stone-800">
              <tr>
                <th className="px-3 py-2.5 text-right">عضو</th>
                <th className="px-3 py-2.5 text-right">دانشکده</th>
                <th className="px-3 py-2.5 text-right">آموزشی</th>
                <th className="px-3 py-2.5 text-right">پژوهشی</th>
                <th className="px-3 py-2.5 text-right">اجرایی</th>
                <th className="px-3 py-2.5 text-right">جمع کل</th>
                {ACTIVITY_LABELS.map(({ key, label }) => (
                  <th
                    key={key}
                    className="whitespace-nowrap px-2 py-2.5 text-right"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/80 bg-stone-50">
              {tableRows.map((row) => (
                <tr key={row.key} className="hover:bg-[var(--surface-raised)]">
                  <td
                    className="max-w-[160px] truncate px-3 py-2 font-medium text-[var(--text)]"
                    title={row.label}
                  >
                    {row.label}
                  </td>
                  <td className="max-w-[120px] truncate px-3 py-2 text-[var(--text-muted)]">
                    {row.faculty}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {row.educationalScore}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {row.researchScore}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {row.executiveScore}
                  </td>
                  <td className="px-3 py-2 font-semibold tabular-nums text-[var(--text)]">
                    {row.totalScore}
                  </td>
                  {ACTIVITY_LABELS.map(({ key }) => (
                    <td
                      key={key}
                      className="px-2 py-2 tabular-nums text-stone-700"
                    >
                      {row.activities[key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
