'use client';

import { Evaluation } from '@/types';
import { getFacultyStats } from '@/components/FacultyComparisonChart';
import { ACTIVITY_LABELS } from '@/lib/activities';
import { useMemo } from 'react';

interface FacultyBreakdownTableProps {
  evaluations: Evaluation[];
}

export default function FacultyBreakdownTable({ evaluations }: FacultyBreakdownTableProps) {
  const rows = useMemo(() => {
    const stats = getFacultyStats(evaluations);
    return stats
      .map((s) => ({
        faculty: s.faculty,
        count: s.count,
        avgEducational: Math.round(s.avgEducational * 10) / 10,
        avgResearch: Math.round(s.avgResearch * 10) / 10,
        avgExecutive: Math.round(s.avgExecutive * 10) / 10,
        avgTotal: Math.round(s.avgTotal * 10) / 10,
        activityTotals: s.activityTotals,
      }))
      .sort((a, b) => b.avgTotal - a.avgTotal);
  }, [evaluations]);

  if (rows.length === 0) return null;

  return (
    <div className="dash-card overflow-hidden p-5 sm:p-6">
      <h3 className="mb-1 text-base font-bold tracking-tight text-stone-900">جزئیات به تفکیک دانشکده</h3>
      <p className="mb-5 text-xs leading-relaxed text-stone-600 sm:mb-6">میانگین امتیازها و جمع شمار فعالیت‌ها</p>
      <div className="overflow-x-auto rounded-md border border-stone-300/80 bg-stone-50">
        <table className="min-w-[800px] w-full border-collapse text-right text-sm">
          <thead className="bg-stone-300/45 text-xs font-semibold text-stone-900">
            <tr className="border-b border-stone-300/80">
              <th className="whitespace-nowrap px-3 py-2.5">دانشکده</th>
              <th className="whitespace-nowrap px-3 py-2.5">تعداد</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-sky-900">میانگین آموزشی</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-teal-900">میانگین پژوهشی</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-amber-950">میانگین اجرایی</th>
              <th className="whitespace-nowrap px-3 py-2.5">میانگین جمع</th>
              {ACTIVITY_LABELS.map(({ key, label }) => (
                <th key={key} className="whitespace-nowrap px-2 py-2.5 text-stone-800" title={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200/90 bg-stone-50">
            {rows.map((r, i) => (
              <tr key={r.faculty} className={i % 2 === 1 ? 'bg-stone-100/70' : ''}>
                <td className="px-3 py-2 font-medium text-stone-900">{r.faculty}</td>
                <td className="px-3 py-2 tabular-nums text-stone-700">{r.count}</td>
                <td className="px-3 py-2 tabular-nums text-sky-900">{r.avgEducational}</td>
                <td className="px-3 py-2 tabular-nums text-teal-900">{r.avgResearch}</td>
                <td className="px-3 py-2 tabular-nums text-amber-950">{r.avgExecutive}</td>
                <td className="px-3 py-2 font-semibold tabular-nums text-stone-900">{r.avgTotal}</td>
                {ACTIVITY_LABELS.map(({ key }) => (
                  <td key={key} className="px-2 py-2 tabular-nums text-stone-700">
                    {r.activityTotals[key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
