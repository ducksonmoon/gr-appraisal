'use client';

import { Evaluation } from '@/types';
import { Trophy, Medal, Award } from 'lucide-react';

interface TopPerformersProps {
  evaluations: Evaluation[];
}

function rankRowClass(rank: number) {
  if (rank === 0) return 'border-indigo-300/80 bg-indigo-50/90';
  if (rank === 1) return 'border-stone-300/90 bg-stone-200/50';
  if (rank === 2) return 'border-amber-200/90 bg-amber-50/80';
  return 'border-stone-200/80 bg-stone-100/60';
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 0) return <Trophy className="h-5 w-5 text-indigo-800" aria-hidden />;
  if (rank === 1) return <Medal className="h-5 w-5 text-stone-600" aria-hidden />;
  if (rank === 2) return <Award className="h-5 w-5 text-amber-800" aria-hidden />;
  return <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-300/80 text-xs font-bold text-stone-700">{rank + 1}</span>;
}

export default function TopPerformers({ evaluations }: TopPerformersProps) {
  const topPerformers = {
    total: [...evaluations].sort((a, b) => b.totalScore - a.totalScore).slice(0, 3),
    educational: [...evaluations].sort((a, b) => b.educationalScore - a.educationalScore).slice(0, 3),
    research: [...evaluations].sort((a, b) => b.researchScore - a.researchScore).slice(0, 3),
    executive: [...evaluations].sort((a, b) => b.executiveScore - a.executiveScore).slice(0, 3),
  };

  const PerformanceCard = ({
    title,
    performers,
    scoreKey,
  }: {
    title: string;
    performers: Evaluation[];
    scoreKey: 'totalScore' | 'educationalScore' | 'researchScore' | 'executiveScore';
  }) => (
    <div className="dash-card overflow-hidden p-5 sm:p-6">
      <h3 className="mb-3 border-b border-stone-300/70 pb-2.5 text-sm font-bold tracking-tight text-stone-900">{title}</h3>
      <ul className="space-y-2.5">
        {performers.map((performer, index) => (
          <li
            key={`${performer.id ?? performer.nationalId}-${performer.facultyName}-${index}`}
            className={`flex min-h-12 items-center justify-between gap-3 rounded-md border px-3 py-2.5 sm:min-h-0 ${rankRowClass(index)}`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <RankIcon rank={index} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-stone-900">{performer.facultyName}</p>
                <p className="truncate text-xs text-stone-600">
                  {performer.faculty}
                  {performer.nationalId ? ` · ${performer.nationalId}` : ''}
                </p>
              </div>
            </div>
            <p className="shrink-0 text-lg font-bold tabular-nums text-stone-900">{performer[scoreKey]}</p>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section aria-labelledby="top-perf-heading">
      <h2 id="top-perf-heading" className="mb-2 text-lg font-bold tracking-tight text-stone-900 sm:text-xl">
        برترین‌ها در دادهٔ فعلی
      </h2>
      <p className="mb-5 max-w-3xl text-sm leading-relaxed text-stone-600 sm:mb-6">
        سه رتبهٔ نخست در هر معیار، مطابق فیلترهای اعمال‌شده در پنل کناری.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <PerformanceCard title="جمع کل امتیاز" performers={topPerformers.total} scoreKey="totalScore" />
        <PerformanceCard title="امتیاز آموزشی" performers={topPerformers.educational} scoreKey="educationalScore" />
        <PerformanceCard title="امتیاز پژوهشی" performers={topPerformers.research} scoreKey="researchScore" />
        <PerformanceCard title="امتیاز اجرایی" performers={topPerformers.executive} scoreKey="executiveScore" />
      </div>
    </section>
  );
}
