import { NextResponse } from 'next/server';
import { prisma, evaluationToApi } from '@/lib/prisma';
import type { Evaluation } from '@/types';
import { requireAuth, requireDataEditor } from '@/lib/auth-server';
import { getActorEmail, logDataChange } from '@/lib/audit-log';
import { isValidNationalId, normalizeNationalId } from '@/lib/activities';

function toCreateData(e: Evaluation) {
  const nationalId = normalizeNationalId(e.nationalId);
  if (!isValidNationalId(nationalId)) {
    throw new Error(`کد ملی نامعتبر برای «${e.facultyName}».`);
  }
  return {
    nationalId,
    facultyName: e.facultyName,
    faculty: e.faculty,
    educationalScore: e.educationalScore,
    researchScore: e.researchScore,
    executiveScore: e.executiveScore,
    totalScore: e.totalScore,
    activitiesJson: e.activities ? JSON.stringify(e.activities) : null,
  };
}

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  try {
    const rows = await prisma.evaluation.findMany({
      orderBy: { createdAt: 'asc' },
    });
    const evaluations: Evaluation[] = rows.map(evaluationToApi);
    return NextResponse.json({ evaluations });
  } catch (e) {
    console.error('GET /api/evaluations', e);
    return NextResponse.json(
      { error: 'Failed to fetch evaluations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const admin = await requireDataEditor();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await request.json();
    if (Array.isArray(body.evaluations)) {
      const list = body.evaluations as Evaluation[];
      let data;
      try {
        data = list.map(toCreateData);
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : 'داده نامعتبر' },
          { status: 400 }
        );
      }
      const ids = data.map((d) => d.nationalId);
      const unique = new Set(ids);
      if (unique.size !== ids.length) {
        return NextResponse.json(
          { error: 'کد ملی تکراری در داده‌های ارسالی وجود دارد.' },
          { status: 400 }
        );
      }
      const existing = await prisma.evaluation.findMany({
        where: { nationalId: { in: ids } },
        select: { nationalId: true },
      });
      if (existing.length > 0) {
        return NextResponse.json(
          {
            error: `کد ملی تکراری در پایگاه داده: ${existing
              .map((e) => e.nationalId)
              .join('، ')}`,
          },
          { status: 400 }
        );
      }
      const created = await prisma.evaluation.createMany({ data });
      const actorEmail = await getActorEmail(admin.sub);
      const names = list.slice(0, 40).map((e) => e.facultyName);
      await logDataChange({
        actorUserId: admin.sub,
        actorEmail,
        action: 'EVALUATION_BULK_CREATE',
        summary: `${created.count} رکورد ارزیابی`,
        details: { count: created.count, facultyNames: names },
      });
      return NextResponse.json({ added: created.count });
    }
    return NextResponse.json(
      { error: 'Body must be { evaluations: Evaluation[] }' },
      { status: 400 }
    );
  } catch (e) {
    console.error('POST /api/evaluations', e);
    const msg = e instanceof Error && e.message.includes('Unique')
      ? 'کد ملی تکراری است.'
      : 'Failed to create evaluations';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
