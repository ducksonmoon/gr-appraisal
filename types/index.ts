/** فعالیت‌های سالانه به تفکیک شاخص */
export interface YearlyActivity {
  year: number;
  book: number;
  bookAuthorship: number;
  bookTranslation: number;
  topResearcher: number;
  masterDefense: number;
  externalProject: number;
  internalProject: number;
  isc: number;
  isi: number;
  nationalConference: number;
  internationalConference: number;
}

export type ActivityFieldKey = keyof Omit<YearlyActivity, 'year'>;

export interface Evaluation {
  id?: string;
  /** کد ملی — شناسه یکتا برای تمایز هم‌نام‌ها */
  nationalId: string;
  facultyName: string; // نام هیئت علمی
  faculty: string; // دانشکده
  educationalScore: number; // امتیاز آموزشی
  researchScore: number; // امتیاز پژوهشی
  executiveScore: number; // امتیاز اجرایی
  totalScore: number; // جمع کل امتیاز
  /** تعداد فعالیت‌ها به تفکیک سال (اختیاری) */
  activities?: YearlyActivity[];
}

export interface EvaluationData {
  evaluations: Evaluation[];
}
