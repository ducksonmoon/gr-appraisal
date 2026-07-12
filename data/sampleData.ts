import type { Evaluation, EvaluationData, YearlyActivity } from '@/types';
import { emptyYearlyActivity } from '@/lib/activities';

type YearCounts = Partial<Omit<YearlyActivity, 'year'>>;

function years(
  entries: [number, YearCounts][]
): YearlyActivity[] {
  return entries.map(([year, counts]) => ({
    ...emptyYearlyActivity(year),
    ...counts,
  }));
}

function ev(
  id: string,
  nationalId: string,
  facultyName: string,
  educationalScore: number,
  researchScore: number,
  executiveScore: number,
  activities: YearlyActivity[]
): Evaluation {
  return {
    id,
    nationalId,
    facultyName,
    faculty: 'دانشکده علوم',
    educationalScore,
    researchScore,
    executiveScore,
    totalScore: educationalScore + researchScore + executiveScore,
    activities,
  };
}

/** Sample evaluations with national IDs and explicit scores (not derived). */
const evaluations: Evaluation[] = [
  ev('1', '0012345678', 'محمد اسلامیان', 88, 92, 80, years([
    [1400, { topResearcher: 1, masterDefense: 1, externalProject: 1, isi: 2 }],
    [1401, { topResearcher: 1, masterDefense: 1, externalProject: 1, isi: 4 }],
    [1402, { topResearcher: 1, externalProject: 1, internalProject: 1, isi: 3 }],
    [1403, { topResearcher: 1, internalProject: 1, isi: 6 }],
    [1404, { topResearcher: 1, isi: 8 }],
  ])),
  ev('2', '0012345679', 'احمد کمندی', 90, 85, 78, years([
    [1400, { topResearcher: 1, masterDefense: 2, isi: 2 }],
    [1401, { masterDefense: 1, isc: 1, isi: 3 }],
    [1402, { isi: 2 }],
    [1403, { masterDefense: 3, isc: 1, isi: 8 }],
    [1404, { isi: 2, internationalConference: 6 }],
  ])),
  ev('3', '0012345680', 'کمال راشدی زلفیله', 82, 80, 75, years([
    [1401, { isc: 1, isi: 1 }],
    [1402, { book: 5, bookAuthorship: 2 }],
    [1403, { isc: 1, isi: 1 }],
    [1404, { isi: 1 }],
  ])),
  ev('4', '0012345681', 'محمدمهدی علیان نژادی', 80, 84, 76, years([
    [1400, { isc: 1 }],
    [1401, { book: 1, isi: 2 }],
    [1402, { isi: 2 }],
    [1403, { isc: 1, isi: 1 }],
    [1404, { isi: 1 }],
  ])),
  ev('5', '0012345682', 'زهره نقی زاده', 86, 88, 79, years([
    [1400, { masterDefense: 1, isi: 1 }],
    [1401, { masterDefense: 1, isi: 3 }],
    [1402, { masterDefense: 1, isi: 1 }],
    [1403, { isc: 1, isi: 4 }],
    [1404, { isi: 1, internationalConference: 4 }],
  ])),
  ev('6', '0012345683', 'اکبرهاشمی برزآبادی', 78, 90, 74, years([
    [1400, { isc: 3, isi: 1 }],
    [1401, { masterDefense: 1, isi: 2 }],
    [1402, { isi: 2 }],
    [1403, { externalProject: 1, isi: 4 }],
    [1404, { internationalConference: 4 }],
  ])),
  ev('7', '0012345684', 'محمد فیروزجائی', 84, 82, 77, years([
    [1400, { isc: 2 }],
    [1401, { masterDefense: 1, isc: 1, isi: 1 }],
    [1402, { masterDefense: 1, isi: 2 }],
    [1403, { isc: 1 }],
    [1404, { isi: 1 }],
  ])),
  ev('8', '0012345685', 'آرمین حاجیان', 76, 75, 72, years([
    [1403, { isc: 1 }],
  ])),
  ev('9', '0012345686', 'خانم مریم زکیان', 85, 87, 80, years([
    [1400, { book: 2, isc: 1 }],
    [1401, { topResearcher: 1, isi: 3 }],
  ])),
  ev('10', '0012345687', 'خانم ماریا افشاری', 91, 86, 81, years([
    [1400, { masterDefense: 4 }],
    [1401, { isc: 1 }],
    [1402, { internalProject: 2 }],
    [1403, { externalProject: 3, isc: 1 }],
    [1404, { book: 1, isi: 2 }],
  ])),
  ev('11', '0012345688', 'خانم مریم قربانی', 83, 78, 75, years([
    [1400, { masterDefense: 2 }],
  ])),
  ev('12', '0012345689', 'موسی نظری', 79, 81, 73, years([
    [1402, { isi: 2 }],
    [1403, { isc: 1, isi: 1 }],
    [1404, { isi: 1 }],
  ])),
  ev('13', '0012345690', 'اشکان فخری', 87, 89, 82, years([
    [1400, { masterDefense: 1, isi: 1 }],
    [1401, { masterDefense: 1 }],
    [1402, { internalProject: 3, book: 1 }],
    [1403, { externalProject: 1, isc: 1 }],
    [1404, { bookAuthorship: 1, isi: 1 }],
  ])),
  ev('14', '0012345691', 'خانم الهام نوبری', 81, 83, 76, years([
    [1401, { book: 1 }],
    [1403, { isc: 1 }],
    [1404, { isi: 2 }],
  ])),
  ev('15', '0012345692', 'حمیدمحمدزاده', 75, 75, 72, years([])),
  ev('16', '0012345693', 'سید خلیل باقری', 80, 79, 74, years([
    [1400, { isc: 1 }],
    [1401, { isc: 1 }],
    [1402, { book: 1 }],
    [1404, { isi: 1 }],
  ])),
  ev('17', '0012345694', 'مسیب احمدی', 77, 76, 73, years([])),
  ev('18', '0012345695', 'علی طهماسبی', 82, 84, 78, years([
    [1400, { isi: 2 }],
    [1401, { isi: 2 }],
    [1402, { book: 1 }],
    [1403, { isc: 1, isi: 1 }],
    [1404, { isi: 1 }],
  ])),
  ev('19', '0012345696', 'محمدحسین شیرافکن', 89, 95, 85, years([
    [1401, { isc: 1 }],
    [1402, { internalProject: 7, isi: 1 }],
    [1403, { isc: 2 }],
    [1404, { topResearcher: 1, masterDefense: 7, externalProject: 1, internalProject: 1, isc: 4, nationalConference: 2 }],
  ])),
  ev('20', '0012345697', 'محدثه انزانی', 78, 80, 74, years([
    [1404, { isi: 1 }],
  ])),
];

export const sampleData: EvaluationData = { evaluations };
