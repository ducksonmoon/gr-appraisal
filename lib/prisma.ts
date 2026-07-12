import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import type { Evaluation, YearlyActivity } from '@/types';

const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url });
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export function evaluationToApi(row: {
  id: string;
  nationalId: string | null;
  facultyName: string;
  faculty: string;
  educationalScore: number;
  researchScore: number;
  executiveScore: number;
  totalScore: number;
  activitiesJson: string | null;
}): Evaluation {
  let activities: YearlyActivity[] | undefined;
  if (row.activitiesJson) {
    try {
      activities = JSON.parse(row.activitiesJson) as YearlyActivity[];
    } catch {
      activities = undefined;
    }
  }
  return {
    id: row.id,
    nationalId: row.nationalId ?? '',
    facultyName: row.facultyName,
    faculty: row.faculty,
    educationalScore: row.educationalScore,
    researchScore: row.researchScore,
    executiveScore: row.executiveScore,
    totalScore: row.totalScore,
    activities,
  };
}
