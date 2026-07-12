import { prisma } from '@/lib/prisma';

const MAX_JSON_LEN = 14_000;

function safeJson(value: unknown): string | null {
  try {
    const s = JSON.stringify(value);
    if (s.length <= MAX_JSON_LEN) return s;
    return s.slice(0, MAX_JSON_LEN) + '…';
  } catch {
    return null;
  }
}

/** Never throw — logging must not break primary operations */
export async function logDataChange(input: {
  actorUserId: string;
  actorEmail: string;
  action: string;
  entityId?: string | null;
  summary?: string | null;
  details?: unknown;
}): Promise<void> {
  try {
    await prisma.dataChangeLog.create({
      data: {
        actorUserId: input.actorUserId,
        actorEmail: input.actorEmail,
        action: input.action,
        entityId: input.entityId ?? null,
        summary: input.summary ?? null,
        detailsJson: input.details !== undefined ? safeJson(input.details) : null,
      },
    });
  } catch (e) {
    console.error('logDataChange', e);
  }
}

export async function getActorEmail(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return u?.email ?? userId;
}

type EvalRow = {
  id: string;
  nationalId?: string | null;
  facultyName: string;
  faculty: string;
  educationalScore: number;
  researchScore: number;
  executiveScore: number;
  totalScore: number;
  activitiesJson: string | null;
};

export function evaluationSnapshot(row: EvalRow) {
  let activitiesNote: string | undefined;
  if (row.activitiesJson) {
    try {
      const parsed = JSON.parse(row.activitiesJson) as unknown;
      activitiesNote = Array.isArray(parsed)
        ? `${parsed.length} سال فعالیت`
        : 'فعالیت';
    } catch {
      activitiesNote = 'فعالیت (نامعتبر)';
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
    ...(activitiesNote ? { activities: activitiesNote } : {}),
  };
}
