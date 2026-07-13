import { ACTIVITY_LABELS } from '@/lib/activities';

/** Number of sample years in the downloadable template (years start at 1400). */
export const SAMPLE_YEAR_COUNT = 2;
export const SAMPLE_START_YEAR = 1400;

export const SAMPLE_EXCEL_FILENAME = 'نمونه-قالب-ارزیابی.xlsx';

/**
 * Build AOA rows matching parseExcelRowsToEvaluations:
 * [empty, rowNum, name, nationalId, ...year×11 activities, edu, research, exec, total]
 */
export function buildSampleImportRows(): (string | number)[][] {
  const years = Array.from(
    { length: SAMPLE_YEAR_COUNT },
    (_, i) => SAMPLE_START_YEAR + i
  );
  const activityLabels = ACTIVITY_LABELS.map((a) => a.label);

  const headerYear: (string | number)[] = ['', '', 'اطلاعات فرد', ''];
  for (const year of years) {
    headerYear.push(`سال ${year}`);
    for (let i = 1; i < activityLabels.length; i++) headerYear.push('');
  }
  headerYear.push('امتیازها', '', '', '');

  const headerFields: (string | number)[] = ['', 'ردیف', 'نام و نام خانوادگی', 'کد ملی'];
  for (const year of years) {
    for (const label of activityLabels) {
      headerFields.push(`${label} (${year})`);
    }
  }
  headerFields.push('امتیاز آموزشی', 'امتیاز پژوهشی', 'امتیاز اجرایی', 'جمع کل');

  const samplePeople: {
    name: string;
    nationalId: string;
    years: number[][];
    scores: [number, number, number];
  }[] = [
    {
      name: 'علی رضایی',
      nationalId: '0012345678',
      years: [
        [1, 0, 0, 1, 2, 0, 1, 1, 2, 0, 1],
        [0, 1, 0, 0, 1, 1, 0, 2, 1, 1, 0],
      ],
      scores: [85, 72, 40],
    },
    {
      name: 'مریم احمدی',
      nationalId: '0098765432',
      years: [
        [0, 1, 1, 0, 1, 0, 0, 1, 0, 2, 0],
        [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1],
      ],
      scores: [78, 65, 55],
    },
  ];

  const dataRows = samplePeople.map((p, idx) => {
    const total = p.scores[0] + p.scores[1] + p.scores[2];
    const row: (string | number)[] = ['', idx + 1, p.name, p.nationalId];
    for (const y of p.years) row.push(...y);
    row.push(...p.scores, total);
    return row;
  });

  return [headerYear, headerFields, ...dataRows];
}
