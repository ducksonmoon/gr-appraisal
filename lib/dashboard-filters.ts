import type { ActivityFieldKey, Evaluation, YearlyActivity } from '@/types';
import { memberKey } from '@/lib/activities';
import { normLabel } from '@/lib/normalize';

/** Keep in sync with ActivityFactorKey in components/Filter.tsx */
export type DashboardActivityFactorKey = ActivityFieldKey;

export type DashboardFilterCriteria = {
  selectedFaculty: string | null;
  /** Empty = all members. Values are memberKey() strings. */
  selectedMemberKeys: string[];
  /** Empty = all years. */
  selectedYears: number[];
  activityFilterType: DashboardActivityFactorKey | '';
  activityFilterMin: number;
};

function activityYearValue(a: YearlyActivity): number | null {
  const y = a.year;
  if (typeof y === 'number' && Number.isFinite(y)) return y;
  const n = Number(y);
  return Number.isFinite(n) ? n : null;
}

export function sliceActivitiesByYears(
  activities: YearlyActivity[] | undefined,
  selectedYears: number[]
): YearlyActivity[] | undefined {
  if (!activities?.length) return activities;
  if (selectedYears.length === 0) return activities;
  const want = new Set(selectedYears);
  return activities.filter((a) => {
    const y = activityYearValue(a);
    return y != null && want.has(y);
  });
}

function activityFieldSum(
  activities: YearlyActivity[] | undefined,
  key: DashboardActivityFactorKey
): number {
  return (activities ?? []).reduce((sum, row) => {
    const raw = row[key] as unknown;
    if (typeof raw === 'number' && Number.isFinite(raw)) return sum + raw;
    const n = Number(raw);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
}

/**
 * Applies dashboard sidebar filters and slices activities to selected years.
 * Empty selectedMemberKeys / selectedYears means "all".
 */
export function applyDashboardFilters(
  evaluations: Evaluation[],
  c: DashboardFilterCriteria
): Evaluation[] {
  let filtered = evaluations;

  if (c.selectedFaculty != null && normLabel(c.selectedFaculty) !== '') {
    const want = normLabel(c.selectedFaculty);
    filtered = filtered.filter((e) => normLabel(e.faculty) === want);
  }

  if (c.selectedMemberKeys.length > 0) {
    const want = new Set(c.selectedMemberKeys);
    filtered = filtered.filter((e) => want.has(memberKey(e)));
  }

  if (c.selectedYears.length > 0) {
    const years = new Set(c.selectedYears);
    filtered = filtered.filter((e) =>
      (e.activities ?? []).some((a) => {
        const y = activityYearValue(a);
        return y != null && years.has(y);
      })
    );
  }

  // Slice activities to selected years for downstream charts/tables/activity min
  filtered = filtered.map((e) => {
    const sliced = sliceActivitiesByYears(e.activities, c.selectedYears);
    if (sliced === e.activities) return e;
    return { ...e, activities: sliced };
  });

  if (c.activityFilterType && c.activityFilterMin > 0) {
    const key = c.activityFilterType;
    const min = c.activityFilterMin;
    filtered = filtered.filter((e) => activityFieldSum(e.activities, key) >= min);
  }

  return filtered;
}
