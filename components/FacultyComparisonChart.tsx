'use client';

import { Evaluation } from '@/types';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { FactorFilter, ActivityFactorKey } from '@/components/Filter';
import { ACTIVITY_FIELD_KEYS, ACTIVITY_LABELS, sumActivities } from '@/lib/activities';
import { CHART, tooltipStyle } from '@/lib/chartTheme';
import { useMemo } from 'react';

interface FacultyComparisonChartProps {
  evaluations: Evaluation[];
  selectedFactor: FactorFilter;
}

export interface FacultyStats {
  faculty: string;
  count: number;
  avgTotal: number;
  avgEducational: number;
  avgResearch: number;
  avgExecutive: number;
  activityTotals: Record<(typeof ACTIVITY_FIELD_KEYS)[number], number>;
}

export function getFacultyStats(evaluations: Evaluation[]): FacultyStats[] {
  const byFaculty = new Map<string, {
    count: number;
    total: number;
    educational: number;
    research: number;
    executive: number;
    activityTotals: FacultyStats['activityTotals'];
  }>();
  for (const e of evaluations) {
    const cur = byFaculty.get(e.faculty);
    const activityTotals = sumActivities(e.activities);
    if (!cur) {
      byFaculty.set(e.faculty, {
        count: 1,
        total: e.totalScore,
        educational: e.educationalScore,
        research: e.researchScore,
        executive: e.executiveScore,
        activityTotals,
      });
    } else {
      cur.count += 1;
      cur.total += e.totalScore;
      cur.educational += e.educationalScore;
      cur.research += e.researchScore;
      cur.executive += e.executiveScore;
      for (const k of ACTIVITY_FIELD_KEYS) {
        cur.activityTotals[k] += activityTotals[k];
      }
      byFaculty.set(e.faculty, cur);
    }
  }
  return Array.from(byFaculty.entries()).map(([faculty, agg]) => ({
    faculty,
    count: agg.count,
    avgTotal: agg.count ? agg.total / agg.count : 0,
    avgEducational: agg.count ? agg.educational / agg.count : 0,
    avgResearch: agg.count ? agg.research / agg.count : 0,
    avgExecutive: agg.count ? agg.executive / agg.count : 0,
    activityTotals: agg.activityTotals,
  }));
}

const FACTOR_LABELS: Record<string, string> = {
  all: 'همه',
  total: 'جمع کل',
  educational: 'آموزشی',
  research: 'پژوهشی',
  executive: 'اجرایی',
  ...Object.fromEntries(ACTIVITY_LABELS.map(({ key, label }) => [key, label])),
};

const ACTIVITY_FILL_COLORS: Record<string, string> = {
  book: CHART.edu,
  bookAuthorship: CHART.secondary,
  bookTranslation: '#4a6fa5',
  topResearcher: '#5b4a7a',
  masterDefense: '#0e7490',
  externalProject: CHART.executive,
  internalProject: '#9a5b2e',
  isc: CHART.research,
  isi: CHART.total,
  nationalConference: CHART.research,
  internationalConference: CHART.edu,
};

function isActivityFactor(f: FactorFilter): f is ActivityFactorKey {
  return ACTIVITY_FIELD_KEYS.includes(f as ActivityFactorKey);
}

export default function FacultyComparisonChart({ evaluations, selectedFactor }: FacultyComparisonChartProps) {
  const chartData = useMemo(() => {
    const stats = getFacultyStats(evaluations);
    return stats.map((s) => ({
      name: s.faculty,
      fullName: s.faculty,
      count: s.count,
      totalScore: Math.round(s.avgTotal * 10) / 10,
      educationalScore: Math.round(s.avgEducational * 10) / 10,
      researchScore: Math.round(s.avgResearch * 10) / 10,
      executiveScore: Math.round(s.avgExecutive * 10) / 10,
      ...s.activityTotals,
    }));
  }, [evaluations]);

  if (chartData.length === 0) return null;

  const chartHeight = Math.max(350, Math.min(600, chartData.length * 40 + 180));
  const manyBars = chartData.length > 12;
  const isActivity = isActivityFactor(selectedFactor);
  const yLabel = isActivity ? 'جمع تعداد' : 'میانگین امتیاز';

  return (
    <div className="dash-card p-5 sm:p-6">
      <h3 className="mb-1 text-base font-bold tracking-tight text-[var(--text)]">
        {isActivity ? 'مقایسهٔ دانشکده‌ها — فعالیت‌ها' : 'مقایسهٔ دانشکده‌ها — میانگین امتیاز'}
        {selectedFactor !== 'all' && (
          <span className="mr-2 text-sm font-normal text-[var(--text-muted)]">— {FACTOR_LABELS[selectedFactor]}</span>
        )}
      </h3>
      <p className="mb-5 text-xs leading-relaxed text-[var(--text-muted)] sm:mb-6">بر اساس دادهٔ فیلترشده در گزارش</p>
      <div className="w-full overflow-x-auto">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <RechartsBarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 20, bottom: manyBars ? 100 : 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
            <XAxis
              dataKey="name"
              tick={{ fill: CHART.tick, fontSize: 11 }}
              angle={manyBars ? -35 : 0}
              textAnchor={manyBars ? 'end' : 'middle'}
              height={manyBars ? 100 : 50}
              interval={0}
            />
            <YAxis
              tick={{ fill: CHART.tick, fontSize: 11 }}
              label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: CHART.tick, fontSize: 12 }}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ paddingTop: '12px' }} />
            {selectedFactor === 'all' ? (
              <>
                <Bar dataKey="educationalScore" fill={CHART.edu} name="میانگین آموزشی" radius={[2, 2, 0, 0]} />
                <Bar dataKey="researchScore" fill={CHART.research} name="میانگین پژوهشی" radius={[2, 2, 0, 0]} />
                <Bar dataKey="executiveScore" fill={CHART.executive} name="میانگین اجرایی" radius={[2, 2, 0, 0]} />
              </>
            ) : isActivity ? (
              <Bar
                dataKey={selectedFactor}
                fill={ACTIVITY_FILL_COLORS[selectedFactor] ?? CHART.primary}
                name={FACTOR_LABELS[selectedFactor]}
                radius={[2, 2, 0, 0]}
              />
            ) : (
              <Bar
                dataKey={
                  selectedFactor === 'total' ? 'totalScore' :
                  selectedFactor === 'educational' ? 'educationalScore' :
                  selectedFactor === 'research' ? 'researchScore' : 'executiveScore'
                }
                fill={
                  selectedFactor === 'total'
                    ? CHART.total
                    : selectedFactor === 'educational'
                      ? CHART.edu
                      : selectedFactor === 'research'
                        ? CHART.research
                        : CHART.executive
                }
                name={
                  selectedFactor === 'total' ? 'میانگین جمع کل' :
                  selectedFactor === 'educational' ? 'میانگین آموزشی' :
                  selectedFactor === 'research' ? 'میانگین پژوهشی' : 'میانگین اجرایی'
                }
                radius={[2, 2, 0, 0]}
              />
            )}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
