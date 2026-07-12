import type { ActivityFieldKey, Evaluation, YearlyActivity } from '@/types';
import { normLabel } from '@/lib/normalize';

export const ACTIVITY_FIELD_KEYS: ActivityFieldKey[] = [
  'book',
  'bookAuthorship',
  'bookTranslation',
  'topResearcher',
  'masterDefense',
  'externalProject',
  'internalProject',
  'isc',
  'isi',
  'nationalConference',
  'internationalConference',
];

export const ACTIVITY_LABELS: { key: ActivityFieldKey; label: string }[] = [
  { key: 'book', label: 'کتاب' },
  { key: 'bookAuthorship', label: 'تالیف کتاب' },
  { key: 'bookTranslation', label: 'ترجمه کتاب' },
  { key: 'topResearcher', label: 'پژوهشگر برتر' },
  { key: 'masterDefense', label: 'دفاع ارشد' },
  { key: 'externalProject', label: 'طرح خارج' },
  { key: 'internalProject', label: 'طرح داخل' },
  { key: 'isc', label: 'ISC' },
  { key: 'isi', label: 'ISI' },
  { key: 'nationalConference', label: 'مقاله کنفرانس ملی' },
  { key: 'internationalConference', label: 'مقاله کنفرانس بین‌المللی' },
];

export function emptyActivityTotals(): Record<ActivityFieldKey, number> {
  return {
    book: 0,
    bookAuthorship: 0,
    bookTranslation: 0,
    topResearcher: 0,
    masterDefense: 0,
    externalProject: 0,
    internalProject: 0,
    isc: 0,
    isi: 0,
    nationalConference: 0,
    internationalConference: 0,
  };
}

export function emptyYearlyActivity(year: number): YearlyActivity {
  return { year, ...emptyActivityTotals() };
}

export function sumActivities(
  activities: YearlyActivity[] | undefined
): Record<ActivityFieldKey, number> {
  const t = emptyActivityTotals();
  if (!activities?.length) return t;
  for (const a of activities) {
    for (const k of ACTIVITY_FIELD_KEYS) {
      const raw = a[k] as unknown;
      const n = typeof raw === 'number' && Number.isFinite(raw) ? raw : Number(raw);
      t[k] += Number.isFinite(n) ? n : 0;
    }
  }
  return t;
}

/** Stable member identity: nationalId when present, else normalized name. */
export function memberKey(e: Pick<Evaluation, 'nationalId' | 'facultyName'>): string {
  const id = (e.nationalId ?? '').trim();
  if (id) return `id:${id}`;
  return `name:${normLabel(e.facultyName)}`;
}

export function memberDisplayLabel(e: Pick<Evaluation, 'nationalId' | 'facultyName'>): string {
  const id = (e.nationalId ?? '').trim();
  if (id) return `${e.facultyName} (${id})`;
  return e.facultyName;
}

/** Normalize Iranian national ID: digits only, 10 chars preferred. */
export function normalizeNationalId(raw: string | number | undefined | null): string {
  const digits = String(raw ?? '').replace(/\D/g, '');
  return digits;
}

export function isValidNationalId(raw: string): boolean {
  const id = normalizeNationalId(raw);
  return id.length >= 8 && id.length <= 10;
}
