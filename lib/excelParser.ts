import type { Evaluation, YearlyActivity } from '@/types';
import { ACTIVITY_FIELD_KEYS, emptyYearlyActivity, normalizeNationalId } from '@/lib/activities';

/** Activity columns per year (order must match Excel blocks). */
export const COLS_PER_YEAR = ACTIVITY_FIELD_KEYS.length; // 11
/** After empty, rowNum, facultyName, nationalId */
export const FIRST_ACTIVITY_COL = 4;

export function parseCell(v: string | number | undefined): number {
  if (v === '-' || v === '' || v == null) return 0;
  if (v === '*') return 1;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function inferYearCount(rowLength: number): { numYears: number; hasTotalCol: boolean } {
  const afterIdentity = rowLength - FIRST_ACTIVITY_COL;
  // Prefer layout with optional total: years * 11 + 4 scores
  if (afterIdentity >= COLS_PER_YEAR + 4 && (afterIdentity - 4) % COLS_PER_YEAR === 0) {
    return { numYears: (afterIdentity - 4) / COLS_PER_YEAR, hasTotalCol: true };
  }
  if (afterIdentity >= COLS_PER_YEAR + 3 && (afterIdentity - 3) % COLS_PER_YEAR === 0) {
    return { numYears: (afterIdentity - 3) / COLS_PER_YEAR, hasTotalCol: false };
  }
  // Fallback: as many full year blocks as fit, remaining as scores
  const numYears = Math.max(0, Math.floor((afterIdentity - 3) / COLS_PER_YEAR));
  return { numYears, hasTotalCol: afterIdentity - numYears * COLS_PER_YEAR >= 4 };
}

/**
 * Parse activity columns from a data row.
 * Layout: [empty, rowNum, name, nationalId, ...year blocks of 11, educational, research, executive, (total?)]
 */
export function rowToActivities(row: (string | number)[]): YearlyActivity[] {
  const { numYears } = inferYearCount(row.length);
  const activities: YearlyActivity[] = [];
  for (let y = 0; y < numYears; y++) {
    const base = FIRST_ACTIVITY_COL + y * COLS_PER_YEAR;
    const a = emptyYearlyActivity(1400 + y);
    ACTIVITY_FIELD_KEYS.forEach((key, i) => {
      a[key] = parseCell(row[base + i] as string | number);
    });
    activities.push(a);
  }
  return activities;
}

/** Read scores from the trailing columns after activity blocks. */
export function rowToScores(row: (string | number)[]): {
  educationalScore: number;
  researchScore: number;
  executiveScore: number;
  totalScore: number;
} {
  const { numYears, hasTotalCol } = inferYearCount(row.length);
  const scoreStart = FIRST_ACTIVITY_COL + numYears * COLS_PER_YEAR;
  const educationalScore = parseCell(row[scoreStart] as string | number);
  const researchScore = parseCell(row[scoreStart + 1] as string | number);
  const executiveScore = parseCell(row[scoreStart + 2] as string | number);
  const totalRaw = hasTotalCol ? parseCell(row[scoreStart + 3] as string | number) : 0;
  const totalScore =
    totalRaw > 0 ? totalRaw : educationalScore + researchScore + executiveScore;
  return { educationalScore, researchScore, executiveScore, totalScore };
}

/**
 * Expects raw sheet rows: first 2 rows are headers, then data rows
 * with [empty, rowNum, facultyName, nationalId, ...activity columns, scores].
 */
export function parseExcelRowsToEvaluations(
  rows: (string | number)[][],
  faculty: string,
  startId: number = 1
): Evaluation[] {
  const evaluations: Evaluation[] = [];
  const seenIds = new Set<string>();

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < FIRST_ACTIVITY_COL) continue;
    const name = String(row[2] ?? '').trim();
    if (!name) continue;

    const nationalId = normalizeNationalId(row[3] as string | number);
    if (!nationalId) {
      throw new Error(`ردیف ${i + 1}: کد ملی برای «${name}» الزامی است.`);
    }
    if (seenIds.has(nationalId)) {
      throw new Error(`ردیف ${i + 1}: کد ملی تکراری «${nationalId}».`);
    }
    seenIds.add(nationalId);

    const activities = rowToActivities(row);
    const scores = rowToScores(row);

    evaluations.push({
      id: String(startId + evaluations.length),
      nationalId,
      facultyName: name,
      faculty,
      educationalScore: scores.educationalScore,
      researchScore: scores.researchScore,
      executiveScore: scores.executiveScore,
      totalScore: scores.totalScore,
      activities: activities.length ? activities : undefined,
    });
  }
  return evaluations;
}
