/**
 * Scenario checks for dashboard filter logic (run: npx tsx scripts/verify-dashboard-filters.ts).
 */
import type { Evaluation, YearlyActivity } from '@/types';
import { applyDashboardFilters } from '../lib/dashboard-filters';
import { emptyYearlyActivity, memberKey } from '../lib/activities';
import { sampleData } from '../data/sampleData';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
}

const full = sampleData.evaluations;

// --- Scenario 1: no criteria → full list
{
  const out = applyDashboardFilters(full, {
    selectedFaculty: null,
    selectedMemberKeys: [],
    selectedYears: [],
    activityFilterType: '',
    activityFilterMin: 0,
  });
  assert(out.length === full.length, 'no filters should keep all rows');
}

// --- Scenario 2: single member key
{
  const target = full[0];
  const out = applyDashboardFilters(full, {
    selectedFaculty: null,
    selectedMemberKeys: [memberKey(target)],
    selectedYears: [],
    activityFilterType: '',
    activityFilterMin: 0,
  });
  assert(
    out.length >= 1 && out.every((e) => memberKey(e) === memberKey(target)),
    'member key filter should keep only matching members'
  );
}

// --- Scenario 3: faculty + member
{
  const target = full[0];
  const out = applyDashboardFilters(full, {
    selectedFaculty: `  ${target.faculty} `,
    selectedMemberKeys: [memberKey(target)],
    selectedYears: [],
    activityFilterType: '',
    activityFilterMin: 0,
  });
  assert(out.length === 1 && out[0].id === target.id, 'faculty + member should match one row');
}

// --- Scenario 4: year present — activities sliced to that year
{
  const out = applyDashboardFilters(full, {
    selectedFaculty: null,
    selectedMemberKeys: [],
    selectedYears: [1400],
    activityFilterType: '',
    activityFilterMin: 0,
  });
  assert(
    out.every((e) => (e.activities ?? []).every((a) => Number(a.year) === 1400)),
    'year filter should slice activities to selected years'
  );
  assert(out.length > 0, 'sample data should include rows with year 1400');
}

// --- Scenario 5: year with string-typed year in JSON (coercion)
{
  const base = full[0];
  const row0 = (base.activities as YearlyActivity[])[0];
  const patched: Evaluation = {
    ...base,
    activities: [{ ...row0, year: '1401' as unknown as number }],
  };
  const list = [patched];
  const out = applyDashboardFilters(list, {
    selectedFaculty: null,
    selectedMemberKeys: [],
    selectedYears: [1401],
    activityFilterType: '',
    activityFilterMin: 0,
  });
  assert(out.length === 1, 'string year in activity row should still match numeric filter');
  assert((out[0].activities ?? []).length === 1, 'activities should be sliced to matching year');
}

// --- Scenario 6: activity sum threshold + string counts; year-scoped sum
{
  const row: Evaluation = {
    id: 't',
    nationalId: '9999999999',
    facultyName: 'T',
    faculty: 'F',
    educationalScore: 80,
    researchScore: 80,
    executiveScore: 80,
    totalScore: 240,
    activities: [
      { ...emptyYearlyActivity(1400), book: '2' as unknown as number },
      { ...emptyYearlyActivity(1401), book: 1 },
    ],
  };
  const out = applyDashboardFilters([row], {
    selectedFaculty: null,
    selectedMemberKeys: [],
    selectedYears: [],
    activityFilterType: 'book',
    activityFilterMin: 3,
  });
  assert(out.length === 1, 'book sum 2+1 should pass min 3');
  const out2 = applyDashboardFilters([row], {
    selectedFaculty: null,
    selectedMemberKeys: [],
    selectedYears: [],
    activityFilterType: 'book',
    activityFilterMin: 4,
  });
  assert(out2.length === 0, 'book sum 3 should not pass min 4');

  const outYear = applyDashboardFilters([row], {
    selectedFaculty: null,
    selectedMemberKeys: [],
    selectedYears: [1400],
    activityFilterType: 'book',
    activityFilterMin: 2,
  });
  assert(outYear.length === 1, 'year-scoped book sum 2 should pass min 2');
  const outYearFail = applyDashboardFilters([row], {
    selectedFaculty: null,
    selectedMemberKeys: [],
    selectedYears: [1400],
    activityFilterType: 'book',
    activityFilterMin: 3,
  });
  assert(outYearFail.length === 0, 'year-scoped book sum 2 should not pass min 3');
}

// --- Scenario 7: multi-member compare selection
{
  const a = full[0];
  const b = full[1];
  const out = applyDashboardFilters(full, {
    selectedFaculty: null,
    selectedMemberKeys: [memberKey(a), memberKey(b)],
    selectedYears: [],
    activityFilterType: '',
    activityFilterMin: 0,
  });
  assert(out.length === 2, 'two member keys should keep two rows');
}

// --- Scenario 8: incompatible faculty
{
  const target = full[0];
  const out = applyDashboardFilters(full, {
    selectedFaculty: 'دانشکده‌ای که وجود ندارد',
    selectedMemberKeys: [memberKey(target)],
    selectedYears: [],
    activityFilterType: '',
    activityFilterMin: 0,
  });
  assert(out.length === 0, 'impossible faculty+member pair should yield no rows');
}

console.log('OK: dashboard filter scenarios passed (' + full.length + ' sample rows).');
