'use client';

import { Evaluation } from '@/types';
import { ACTIVITY_LABELS, memberDisplayLabel, memberKey } from '@/lib/activities';
import { normLabel } from '@/lib/normalize';
import { Search, Filter as FilterIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

/** Score-based factors */
export type ScoreFactor = 'all' | 'total' | 'educational' | 'research' | 'executive';
/** Activity count factors */
export type ActivityFactorKey = (typeof ACTIVITY_LABELS)[number]['key'];
export type FactorFilter = ScoreFactor | ActivityFactorKey;

interface MemberOption {
  key: string;
  label: string;
  name: string;
}

interface FilterProps {
  evaluations: Evaluation[];
  selectedMemberKeys: string[];
  selectedFaculty: string | null;
  onMemberKeysChange: (keys: string[]) => void;
  onFacultyChange: (faculty: string | null) => void;
  selectedYears?: number[];
  onYearsChange?: (years: number[]) => void;
  selectedFactor?: FactorFilter;
  onFactorChange?: (factor: FactorFilter) => void;
  availableYears?: number[];
  activityFilterType?: ActivityFactorKey | '';
  activityFilterMin?: number;
  onActivityFilterChange?: (type: ActivityFactorKey | '', min: number) => void;
  compact?: boolean;
  filteredCount?: number;
  totalCount?: number;
  onResetAll?: () => void;
}

const SCORE_FACTOR_OPTIONS: { value: ScoreFactor; label: string }[] = [
  { value: 'all', label: 'همه معیارها' },
  { value: 'total', label: 'جمع کل' },
  { value: 'educational', label: 'امتیاز آموزشی' },
  { value: 'research', label: 'امتیاز پژوهشی' },
  { value: 'executive', label: 'امتیاز اجرایی' },
];

const ACTIVITY_FACTOR_OPTIONS = ACTIVITY_LABELS.map(({ key, label }) => ({
  value: key as ActivityFactorKey,
  label,
}));

const FACTOR_OPTIONS: { value: FactorFilter; label: string }[] = [
  ...SCORE_FACTOR_OPTIONS,
  ...ACTIVITY_FACTOR_OPTIONS,
];

export function getFactorFilterLabel(f: FactorFilter): string {
  return FACTOR_OPTIONS.find((o) => o.value === f)?.label ?? String(f);
}

const chipActive = 'bg-[var(--brand)] text-white';
const chipIdle =
  'border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] hover:bg-[var(--surface-card)]';

export default function Filter({
  evaluations,
  selectedMemberKeys,
  selectedFaculty,
  onMemberKeysChange,
  onFacultyChange,
  selectedYears = [],
  onYearsChange,
  selectedFactor = 'all',
  onFactorChange,
  availableYears = [],
  activityFilterType = '',
  activityFilterMin = 0,
  onActivityFilterChange,
  compact = false,
  filteredCount,
  totalCount,
  onResetAll,
}: FilterProps) {
  const [facultySearch, setFacultySearch] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const rowScopedAdvanced =
    selectedYears.length > 0 || (Boolean(activityFilterType) && activityFilterMin > 0);
  const chartMetricCustom = selectedFactor !== 'all';
  const [moreOpen, setMoreOpen] = useState(() => rowScopedAdvanced || chartMetricCustom);

  useEffect(() => {
    if (rowScopedAdvanced || selectedFactor !== 'all') setMoreOpen(true);
  }, [rowScopedAdvanced, selectedFactor]);

  const evaluationsForNameChips = useMemo(() => {
    if (selectedFaculty == null || normLabel(selectedFaculty) === '') return evaluations;
    const want = normLabel(selectedFaculty);
    return evaluations.filter((e) => normLabel(e.faculty) === want);
  }, [evaluations, selectedFaculty]);

  const evaluationsForFacultyChips = useMemo(() => {
    if (selectedMemberKeys.length === 0) return evaluations;
    const want = new Set(selectedMemberKeys);
    return evaluations.filter((e) => want.has(memberKey(e)));
  }, [evaluations, selectedMemberKeys]);

  const memberOptions = useMemo(() => {
    const map = new Map<string, MemberOption>();
    evaluationsForNameChips.forEach((e) => {
      const key = memberKey(e);
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: memberDisplayLabel(e),
          name: e.facultyName,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'fa'));
  }, [evaluationsForNameChips]);

  const uniqueFaculties = useMemo(() => {
    const facultySet = new Set<string>();
    evaluationsForFacultyChips.forEach((e) => facultySet.add(normLabel(e.faculty)));
    return Array.from(facultySet).sort((a, b) => a.localeCompare(b, 'fa'));
  }, [evaluationsForFacultyChips]);

  const fq = normLabel(facultySearch).toLowerCase();
  const nq = normLabel(nameSearch).toLowerCase();
  const filteredFaculties = uniqueFaculties.filter((f) =>
    normLabel(f).toLowerCase().includes(fq)
  );
  const filteredMembers = memberOptions.filter(
    (m) =>
      normLabel(m.name).toLowerCase().includes(nq) ||
      normLabel(m.label).toLowerCase().includes(nq)
  );

  const toggleMember = (key: string) => {
    if (selectedMemberKeys.includes(key)) {
      onMemberKeysChange(selectedMemberKeys.filter((k) => k !== key));
    } else {
      onMemberKeysChange([...selectedMemberKeys, key]);
    }
  };

  const toggleYear = (year: number) => {
    if (!onYearsChange) return;
    if (selectedYears.includes(year)) {
      onYearsChange(selectedYears.filter((y) => y !== year));
    } else {
      onYearsChange([...selectedYears, year].sort((a, b) => a - b));
    }
  };

  const hasAdvancedControls = onYearsChange || onFactorChange || onActivityFilterChange;
  const showSummary =
    filteredCount !== undefined && totalCount !== undefined && Number.isFinite(filteredCount);

  return (
    <div className={compact ? 'p-0' : 'dash-card p-5 sm:p-6'}>
      {!compact && (
        <div className="mb-4 flex items-center gap-2">
          <FilterIcon className="h-5 w-5 text-stone-500" aria-hidden />
          <h2 className="text-lg font-bold text-stone-900">فیلتر گزارش</h2>
        </div>
      )}

      <div className="space-y-6">
        <section className="space-y-2" aria-labelledby="filter-faculty-heading">
          <div>
            <h3 id="filter-faculty-heading" className="text-sm font-bold text-stone-900">
              دانشکده
            </h3>
            <p className="mt-0.5 text-[11px] leading-snug text-stone-500">
              ابتدا حوزه سازمانی را مشخص کنید؛ فهرست اعضا به‌صورت خودکار هم‌راستا می‌شود.
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" aria-hidden />
            <input
              type="search"
              placeholder="جستجوی دانشکده…"
              value={facultySearch}
              onChange={(e) => setFacultySearch(e.target.value)}
              className="dash-input pr-9 pl-3 py-2 text-sm"
              dir="rtl"
              aria-label="جستجوی دانشکده"
            />
          </div>
          <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-md border border-stone-200/80 bg-stone-50/50 p-2">
            <button
              type="button"
              onClick={() => onFacultyChange(null)}
              className={`min-h-9 rounded-md px-3 py-2 text-sm font-medium transition ${
                selectedFaculty == null || normLabel(selectedFaculty) === '' ? chipActive : chipIdle
              }`}
            >
              همه دانشکده‌ها
            </button>
            {filteredFaculties.map((faculty) => (
              <button
                type="button"
                key={faculty}
                onClick={() => onFacultyChange(faculty)}
                className={`min-h-9 max-w-full truncate rounded-md px-3 py-2 text-sm font-medium transition ${
                  selectedFaculty != null && normLabel(selectedFaculty) === faculty ? chipActive : chipIdle
                }`}
              >
                {faculty}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2 border-t border-stone-200/90 pt-5" aria-labelledby="filter-member-heading">
          <div>
            <h3 id="filter-member-heading" className="text-sm font-bold text-stone-900">
              عضو هیئت علمی
            </h3>
            <p className="mt-0.5 text-[11px] leading-snug text-stone-500">
              چند نفر را برای مقایسه انتخاب کنید؛ خالی یعنی همه اعضا.
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" aria-hidden />
            <input
              type="search"
              placeholder="جستجوی نام یا کد ملی…"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="dash-input pr-9 pl-3 py-2 text-sm"
              dir="rtl"
              aria-label="جستجوی نام عضو هیئت علمی"
            />
          </div>
          <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-md border border-stone-200/80 bg-stone-50/50 p-2">
            <button
              type="button"
              onClick={() => onMemberKeysChange([])}
              className={`min-h-9 rounded-md px-3 py-2 text-sm font-medium transition ${
                selectedMemberKeys.length === 0 ? chipActive : chipIdle
              }`}
            >
              همه اعضا
            </button>
            {filteredMembers.map((m) => (
              <button
                type="button"
                key={m.key}
                onClick={() => toggleMember(m.key)}
                className={`min-h-9 max-w-full truncate rounded-md px-3 py-2 text-sm font-medium transition ${
                  selectedMemberKeys.includes(m.key) ? chipActive : chipIdle
                }`}
                title={m.label}
              >
                {m.label}
              </button>
            ))}
          </div>
        </section>

        {hasAdvancedControls && (
          <div className="border-t border-stone-200/90 pt-4">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-stone-300/80 bg-stone-100/90 px-3 py-2.5 text-right text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-200/50"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((o) => !o)}
            >
              <span>سال، فعالیت و نمودار</span>
              {moreOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-stone-600" aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-stone-600" aria-hidden />
              )}
            </button>
            {moreOpen && (
              <div className="mt-3 space-y-4 rounded-md border border-stone-200/80 bg-stone-50/40 p-3">
                {onYearsChange && availableYears.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-stone-700">سال فعالیت (چند انتخابی)</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onYearsChange([])}
                        className={`min-h-8 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                          selectedYears.length === 0 ? chipActive : chipIdle
                        }`}
                      >
                        همه سال‌ها
                      </button>
                      {[...availableYears]
                        .sort((a, b) => a - b)
                        .map((y) => (
                          <button
                            type="button"
                            key={y}
                            onClick={() => toggleYear(y)}
                            className={`min-h-8 rounded-md px-2.5 py-1.5 text-xs font-medium tabular-nums transition ${
                              selectedYears.includes(y) ? chipActive : chipIdle
                            }`}
                          >
                            {y}
                          </button>
                        ))}
                    </div>
                    <p className="text-[10px] leading-snug text-stone-500">
                      فعالیت‌ها و حداقل فعالیت فقط روی سال‌های انتخاب‌شده اعمال می‌شود.
                    </p>
                  </div>
                )}
                {onFactorChange && (
                  <div className="flex min-w-0 flex-col gap-1 sm:max-w-[14rem]">
                    <label htmlFor="filter-factor" className="text-xs font-semibold text-stone-700">
                      معیار نمودار مقایسهٔ دانشکده
                    </label>
                    <select
                      id="filter-factor"
                      value={selectedFactor}
                      onChange={(e) => onFactorChange(e.target.value as FactorFilter)}
                      className="dash-input py-2 text-sm"
                    >
                      {FACTOR_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] leading-snug text-stone-500">
                      روی نمودار «مقایسهٔ دانشکده‌ها» اثر دارد، نه روی تعداد ردیف‌های جدول.
                    </p>
                  </div>
                )}
                {onActivityFilterChange && (
                  <div className="flex flex-wrap items-end gap-2 border-t border-stone-200/80 pt-3">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="filter-act-type" className="text-xs font-semibold text-stone-700">
                        حداقل جمع فعالیت
                      </label>
                      <select
                        id="filter-act-type"
                        value={activityFilterType}
                        onChange={(e) => {
                          const v = (e.target.value || '') as ActivityFactorKey | '';
                          onActivityFilterChange(v, v ? activityFilterMin : 0);
                        }}
                        className="dash-input min-w-[8rem] py-2 text-sm"
                      >
                        <option value="">بدون فیلتر</option>
                        {ACTIVITY_FACTOR_OPTIONS.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {activityFilterType ? (
                      <div className="flex flex-col gap-1">
                        <label htmlFor="filter-act-min" className="text-xs font-semibold text-stone-700">
                          حداقل مقدار
                        </label>
                        <input
                          id="filter-act-min"
                          type="number"
                          min={0}
                          value={activityFilterMin}
                          onChange={(e) =>
                            onActivityFilterChange(
                              activityFilterType,
                              Math.max(0, parseInt(e.target.value, 10) || 0)
                            )
                          }
                          className="dash-input w-24 py-2 text-sm tabular-nums"
                        />
                      </div>
                    ) : null}
                    <p className="w-full text-[10px] leading-snug text-stone-500">
                      جمع شاخص در سال‌های فیلترشده (یا همه سال‌ها) با این حداقل مقایسه می‌شود.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {(showSummary || onResetAll) && (
        <div className="mt-6 border-t border-stone-200/90 pt-4">
          {showSummary && (
            <p className="text-xs text-stone-600" aria-live="polite">
              <span className="tabular-nums font-bold text-stone-900">{filteredCount}</span>
              {' از '}
              <span className="tabular-nums font-medium text-stone-800">{totalCount}</span>
              {' رکورد با فیلتر فعلی نمایش داده می‌شود.'}
            </p>
          )}
          {onResetAll && (
            <button
              type="button"
              className="mt-3 w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-100"
              onClick={onResetAll}
            >
              پاکسازی همه فیلترها
            </button>
          )}
        </div>
      )}
    </div>
  );
}
