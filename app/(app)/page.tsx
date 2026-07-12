'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import Filter, {
  type FactorFilter,
  type ActivityFactorKey,
  getFactorFilterLabel,
} from '@/components/Filter';
import { applyDashboardFilters } from '@/lib/dashboard-filters';
import { ACTIVITY_LABELS as ACTIVITY_LABEL_LIST, memberKey } from '@/lib/activities';
import { normLabel } from '@/lib/normalize';
import AppShell from '@/components/AppShell';
import BarChart from '@/components/BarChart';
import PieChart from '@/components/PieChart';
import DataTable from '@/components/DataTable';
import ActivityTotalsChart from '@/components/ActivityTotalsChart';
import FacultyComparisonChart from '@/components/FacultyComparisonChart';
import FacultyBreakdownTable from '@/components/FacultyBreakdownTable';
import ProfessorComparison from '@/components/ProfessorComparison';
import {
  Filter as FilterIcon,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const ACTIVITY_LABELS: Record<ActivityFactorKey, string> = Object.fromEntries(
  ACTIVITY_LABEL_LIST.map(({ key, label }) => [key, label])
) as Record<ActivityFactorKey, string>;

export default function Home() {
  const [selectedMemberKeys, setSelectedMemberKeys] = useState<string[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedFactor, setSelectedFactor] = useState<FactorFilter>('all');
  const [activityFilterType, setActivityFilterType] = useState<ActivityFactorKey | ''>('');
  const [activityFilterMin, setActivityFilterMin] = useState(0);
  const [filterPanelExpanded, setFilterPanelExpanded] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { evaluations, isLoading, error, refetch } = useData();

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    if (mq.matches) setFilterPanelExpanded(false);
  }, []);

  const dataFilterCount = useMemo(() => {
    let n = 0;
    if (selectedFaculty) n++;
    if (selectedMemberKeys.length > 0) n++;
    if (selectedYears.length > 0) n++;
    if (activityFilterType && activityFilterMin > 0) n++;
    return n;
  }, [selectedFaculty, selectedMemberKeys, selectedYears, activityFilterType, activityFilterMin]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    evaluations.forEach((e) =>
      e.activities?.forEach((a) => {
        const y = typeof a.year === 'number' && Number.isFinite(a.year) ? a.year : Number(a.year);
        if (Number.isFinite(y)) years.add(y);
      })
    );
    return Array.from(years);
  }, [evaluations]);

  const filteredEvaluations = useMemo(
    () =>
      applyDashboardFilters(evaluations, {
        selectedFaculty,
        selectedMemberKeys,
        selectedYears,
        activityFilterType,
        activityFilterMin,
      }),
    [evaluations, selectedFaculty, selectedMemberKeys, selectedYears, activityFilterType, activityFilterMin]
  );

  const showProfessorCompare = selectedMemberKeys.length >= 2;

  const handleFacultyChange = useCallback(
    (faculty: string | null) => {
      setSelectedFaculty(faculty);
      if (faculty == null) return;
      setSelectedMemberKeys((prev) => {
        if (prev.length === 0) return prev;
        return prev.filter((key) =>
          evaluations.some(
            (e) => memberKey(e) === key && normLabel(e.faculty) === normLabel(faculty)
          )
        );
      });
    },
    [evaluations]
  );

  const handleMemberKeysChange = useCallback(
    (keys: string[]) => {
      setSelectedMemberKeys(keys);
      if (keys.length === 0) return;
      setSelectedFaculty((prev) => {
        if (prev == null) return prev;
        const ok = keys.some((key) =>
          evaluations.some(
            (e) => memberKey(e) === key && normLabel(e.faculty) === normLabel(prev)
          )
        );
        return ok ? prev : null;
      });
    },
    [evaluations]
  );

  const clearAllFilters = useCallback(() => {
    setSelectedFaculty(null);
    setSelectedMemberKeys([]);
    setSelectedYears([]);
    setSelectedFactor('all');
    setActivityFilterType('');
    setActivityFilterMin(0);
  }, []);

  const showFilterEmpty =
    !isLoading && !error && evaluations.length > 0 && filteredEvaluations.length === 0;

  const barChartData = useMemo(() => {
    const sorted = [...filteredEvaluations].sort((a, b) => b.totalScore - a.totalScore);
    return sorted.slice(0, 40).map((evaluation) => ({
      name:
        evaluation.facultyName.length > 14
          ? evaluation.facultyName.substring(0, 14) + '…'
          : evaluation.facultyName,
      fullName: evaluation.facultyName,
      educationalScore: evaluation.educationalScore,
      researchScore: evaluation.researchScore,
      executiveScore: evaluation.executiveScore,
    }));
  }, [filteredEvaluations]);

  const pieChartData = useMemo(() => {
    const facultyMap = new Map<string, number>();
    filteredEvaluations.forEach((evaluation) => {
      facultyMap.set(evaluation.faculty, (facultyMap.get(evaluation.faculty) || 0) + 1);
    });
    return Array.from(facultyMap.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredEvaluations]);

  const stats = useMemo(() => {
    if (filteredEvaluations.length === 0) {
      return {
        avgTotalScore: 0,
        avgEducationalScore: 0,
        avgResearchScore: 0,
        avgExecutiveScore: 0,
        maxTotalScore: 0,
        maxEducationalScore: 0,
        maxResearchScore: 0,
        maxExecutiveScore: 0,
      };
    }
    const totals = filteredEvaluations.reduce(
      (acc, e) => ({
        totalScore: acc.totalScore + e.totalScore,
        educationalScore: acc.educationalScore + e.educationalScore,
        researchScore: acc.researchScore + e.researchScore,
        executiveScore: acc.executiveScore + e.executiveScore,
      }),
      { totalScore: 0, educationalScore: 0, researchScore: 0, executiveScore: 0 }
    );
    const count = filteredEvaluations.length;
    return {
      avgTotalScore: totals.totalScore / count,
      avgEducationalScore: totals.educationalScore / count,
      avgResearchScore: totals.researchScore / count,
      avgExecutiveScore: totals.executiveScore / count,
      maxTotalScore: Math.max(...filteredEvaluations.map((e) => e.totalScore)),
      maxEducationalScore: Math.max(...filteredEvaluations.map((e) => e.educationalScore)),
      maxResearchScore: Math.max(...filteredEvaluations.map((e) => e.researchScore)),
      maxExecutiveScore: Math.max(...filteredEvaluations.map((e) => e.executiveScore)),
    };
  }, [filteredEvaluations]);

  const yearSummary =
    selectedYears.length > 0 ? `سال‌های ${selectedYears.join('، ')}` : 'همه سال‌های ثبت‌شده';

  const statCards = [
    {
      label: 'جمع کل امتیاز',
      max: stats.maxTotalScore,
      avg: stats.avgTotalScore,
      accent: 'border-t-[var(--brand)]',
    },
    {
      label: 'امتیاز آموزشی',
      max: stats.maxEducationalScore,
      avg: stats.avgEducationalScore,
      accent: 'border-t-[var(--accent-edu)]',
    },
    {
      label: 'امتیاز پژوهشی',
      max: stats.maxResearchScore,
      avg: stats.avgResearchScore,
      accent: 'border-t-[var(--accent-research)]',
    },
    {
      label: 'امتیاز اجرایی',
      max: stats.maxExecutiveScore,
      avg: stats.avgExecutiveScore,
      accent: 'border-t-[var(--accent-exec)]',
    },
  ];

  return (
    <AppShell pageTitle="گزارش ارزیابی">
      <div className="dash-app relative min-h-0 pb-12" dir="rtl">
        {filterPanelExpanded && (
          <button
            type="button"
            className="fixed inset-x-0 bottom-0 z-30 bg-[var(--brand)]/25 md:hidden"
            style={{ top: '3.75rem' }}
            aria-label="بستن فیلتر"
            onClick={() => setFilterPanelExpanded(false)}
          />
        )}

        <aside
          className={`dash-aside fixed bottom-0 z-40 flex flex-col border-s transition-[width] duration-200 ease-out ${
            filterPanelExpanded ? 'w-[min(22rem,100vw)]' : 'w-12'
          }`}
          style={{ right: 0, top: '3.75rem' }}
          aria-label="پنل فیلتر"
        >
          {!filterPanelExpanded && (
            <button
              type="button"
              onClick={() => setFilterPanelExpanded(true)}
              className="flex h-full min-h-[8rem] w-full flex-col items-center justify-center gap-2 border-b border-[var(--border)] px-1 py-6 text-[var(--text-muted)] transition hover:bg-[var(--surface-raised)] hover:text-[var(--brand)]"
              aria-label="باز کردن فیلتر"
            >
              <FilterIcon className="h-5 w-5 shrink-0" />
              <span
                className="text-[11px] font-semibold"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                فیلتر
              </span>
              {dataFilterCount > 0 && (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-sm bg-[var(--brand)] px-1 text-xs font-bold text-white">
                  {dataFilterCount}
                </span>
              )}
              <ChevronLeft className="h-4 w-4 shrink-0 opacity-70" />
            </button>
          )}

          {filterPanelExpanded && (
            <>
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
                <h2 className="truncate text-sm font-bold text-[var(--text)]">فیلتر گزارش</h2>
                <button
                  type="button"
                  onClick={() => setFilterPanelExpanded(false)}
                  className="rounded-sm p-2 text-[var(--text-muted)] transition hover:bg-[var(--surface-raised)] hover:text-[var(--text)]"
                  aria-label="جمع کردن پنل"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <Filter
                  compact
                  evaluations={evaluations}
                  selectedMemberKeys={selectedMemberKeys}
                  selectedFaculty={selectedFaculty}
                  onMemberKeysChange={handleMemberKeysChange}
                  onFacultyChange={handleFacultyChange}
                  selectedYears={selectedYears}
                  onYearsChange={setSelectedYears}
                  availableYears={availableYears}
                  selectedFactor={selectedFactor}
                  onFactorChange={setSelectedFactor}
                  activityFilterType={activityFilterType}
                  activityFilterMin={activityFilterMin}
                  onActivityFilterChange={(type, min) => {
                    setActivityFilterType(type);
                    setActivityFilterMin(min);
                  }}
                  filteredCount={filteredEvaluations.length}
                  totalCount={evaluations.length}
                  onResetAll={dataFilterCount > 0 || selectedFactor !== 'all' ? clearAllFilters : undefined}
                />
              </div>
            </>
          )}
        </aside>

        <div
          className={`min-w-0 w-full transition-[padding] duration-200 ease-out ${
            filterPanelExpanded ? 'ps-[min(22rem,100vw)]' : 'ps-12'
          }`}
        >
          <div className="mx-auto max-w-[92rem] px-4 py-5 sm:px-6 lg:px-8">
            <div className="dash-stack">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] pb-4">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-[var(--brand)] sm:text-2xl">
                    خلاصه گزارش ارزیابی
                  </h1>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    <span className="font-semibold tabular-nums text-[var(--text)]">
                      {filteredEvaluations.length}
                    </span>
                    {' از '}
                    <span className="tabular-nums">{evaluations.length}</span>
                    {' رکورد · '}
                    {yearSummary}
                  </p>
                </div>
              </div>

              {isLoading && (
                <div
                  className="flex items-center justify-center gap-3 rounded-sm border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-7 text-sm text-[var(--text-muted)]"
                  role="status"
                >
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--brand)] motion-reduce:animate-none" aria-hidden />
                  در حال بارگذاری داده‌ها…
                </div>
              )}

              {error && (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-900">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <p>{error}</p>
                  </div>
                  <button type="button" onClick={() => refetch()} className="app-btn-secondary">
                    تلاش مجدد
                  </button>
                </div>
              )}

              {dataFilterCount > 0 && (
                <div
                  className="flex flex-col gap-3 rounded-sm border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                  aria-label="فیلترهای فعال"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--text)]">فیلترهای فعال</span>
                    {selectedFaculty && (
                      <button
                        type="button"
                        onClick={() => handleFacultyChange(null)}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-sm border border-[var(--border)] bg-[var(--surface-card)] px-2.5 py-1 text-sm text-[var(--text)]"
                      >
                        <span className="truncate">دانشکده: {selectedFaculty}</span>
                        <X className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                      </button>
                    )}
                    {selectedMemberKeys.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMemberKeysChange([])}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--border)] bg-[var(--surface-card)] px-2.5 py-1 text-sm"
                      >
                        <span>{selectedMemberKeys.length} عضو</span>
                        <X className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                      </button>
                    )}
                    {selectedYears.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedYears([])}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--border)] bg-[var(--surface-card)] px-2.5 py-1 text-sm tabular-nums"
                      >
                        <span>{selectedYears.join('، ')}</span>
                        <X className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                      </button>
                    )}
                    {activityFilterType && activityFilterMin > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setActivityFilterType('');
                          setActivityFilterMin(0);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--border)] bg-[var(--surface-card)] px-2.5 py-1 text-sm"
                      >
                        <span>
                          {ACTIVITY_LABELS[activityFilterType]} ≥ {activityFilterMin}
                        </span>
                        <X className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-sm font-semibold text-[var(--brand)] underline-offset-2 hover:underline"
                  >
                    پاکسازی فیلترها
                  </button>
                </div>
              )}

              {selectedFactor !== 'all' && (
                <p className="text-xs text-[var(--text-muted)]">
                  معیار نمودار دانشکده:{' '}
                  <button
                    type="button"
                    className="font-medium text-[var(--brand)] underline-offset-2 hover:underline"
                    onClick={() => setSelectedFactor('all')}
                  >
                    {getFactorFilterLabel(selectedFactor)} (بازگردانی)
                  </button>
                </p>
              )}

              {showFilterEmpty && (
                <div
                  role="status"
                  className="rounded-sm border border-amber-300/80 bg-amber-50 px-4 py-6 text-center sm:text-right"
                >
                  <p className="text-base font-semibold text-amber-950">نتیجه‌ای با این فیلترها نیست.</p>
                  <p className="mt-2 text-sm text-amber-900/90">معیارها را کم کنید یا همه را پاک کنید.</p>
                  <button type="button" onClick={clearAllFilters} className="app-btn-primary mt-4">
                    پاکسازی فیلترها
                  </button>
                </div>
              )}

              {filteredEvaluations.length > 0 && (
                <>
                  <section aria-labelledby="kpi-heading">
                    <h2 id="kpi-heading" className="sr-only">
                      شاخص‌های کلیدی
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
                      {statCards.map((card) => (
                        <div
                          key={card.label}
                          className={`dash-card border-t-2 p-4 sm:p-5 ${card.accent}`}
                        >
                          <h3 className="text-sm font-medium text-[var(--text-muted)]">{card.label}</h3>
                          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-[var(--text)]">
                            {card.max}
                          </p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            حداکثر · میانگین {card.avg.toFixed(1)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {showProfessorCompare ? (
                    <ProfessorComparison evaluations={filteredEvaluations} />
                  ) : (
                    <>
                      <BarChart data={barChartData} />
                      <FacultyComparisonChart
                        evaluations={filteredEvaluations}
                        selectedFactor={selectedFactor}
                      />
                    </>
                  )}

                  <ActivityTotalsChart evaluations={filteredEvaluations} />

                  <DataTable evaluations={filteredEvaluations} />

                  <div className="dash-card overflow-hidden">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-right text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-raised)]"
                      aria-expanded={detailsOpen}
                      onClick={() => setDetailsOpen((v) => !v)}
                    >
                      <span>جزئیات تکمیلی (توزیع دانشکده و جدول میانگین‌ها)</span>
                      {detailsOpen ? (
                        <ChevronUp className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      )}
                    </button>
                    {detailsOpen && (
                      <div className="space-y-5 border-t border-[var(--border)] p-5">
                        <PieChart data={pieChartData} title="توزیع رکوردها بر اساس دانشکده" />
                        <FacultyBreakdownTable evaluations={filteredEvaluations} />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
