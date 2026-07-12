import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sampleData } from '@/data/sampleData';
import { requireDataEditor } from '@/lib/auth-server';
import { getActorEmail, logDataChange } from '@/lib/audit-log';

export async function POST() {
  const admin = await requireDataEditor();
  if (admin instanceof NextResponse) return admin;
  try {
    await prisma.evaluation.deleteMany({});
    await prisma.evaluation.createMany({
      data: sampleData.evaluations.map((e) => ({
        nationalId: e.nationalId,
        facultyName: e.facultyName,
        faculty: e.faculty,
        educationalScore: e.educationalScore,
        researchScore: e.researchScore,
        executiveScore: e.executiveScore,
        totalScore: e.totalScore,
        activitiesJson: e.activities
          ? JSON.stringify(e.activities)
          : null,
      })),
    });
    const actorEmail = await getActorEmail(admin.sub);
    await logDataChange({
      actorUserId: admin.sub,
      actorEmail,
      action: 'EVALUATIONS_RESET',
      summary: 'بازگردانی به داده نمونه',
      details: {
        seededCount: sampleData.evaluations.length,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/evaluations/reset', e);
    return NextResponse.json(
      { error: 'Failed to reset evaluations' },
      { status: 500 }
    );
  }
}
