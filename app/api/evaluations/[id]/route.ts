import { NextResponse } from 'next/server';
import { prisma, evaluationToApi } from '@/lib/prisma';
import type { Evaluation } from '@/types';
import { requireAuth, requireDataEditor } from '@/lib/auth-server';
import { evaluationSnapshot, getActorEmail, logDataChange } from '@/lib/audit-log';
import { isValidNationalId, normalizeNationalId } from '@/lib/activities';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    const row = await prisma.evaluation.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const evaluation: Evaluation = evaluationToApi(row);
    return NextResponse.json({ evaluation });
  } catch (e) {
    console.error('GET /api/evaluations/[id]', e);
    return NextResponse.json(
      { error: 'Failed to fetch evaluation' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireDataEditor();
  if (admin instanceof NextResponse) return admin;
  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<Evaluation>;
    const existing = await prisma.evaluation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    let nationalIdUpdate: string | undefined;
    if (body.nationalId != null) {
      const nid = normalizeNationalId(body.nationalId);
      if (!isValidNationalId(nid)) {
        return NextResponse.json({ error: 'کد ملی نامعتبر است.' }, { status: 400 });
      }
      const clash = await prisma.evaluation.findFirst({
        where: { nationalId: nid, NOT: { id } },
        select: { id: true },
      });
      if (clash) {
        return NextResponse.json({ error: 'کد ملی تکراری است.' }, { status: 400 });
      }
      nationalIdUpdate = nid;
    }

    const updated = await prisma.evaluation.update({
      where: { id },
      data: {
        ...(nationalIdUpdate != null && { nationalId: nationalIdUpdate }),
        ...(body.facultyName != null && { facultyName: body.facultyName }),
        ...(body.faculty != null && { faculty: body.faculty }),
        ...(body.educationalScore != null && { educationalScore: body.educationalScore }),
        ...(body.researchScore != null && { researchScore: body.researchScore }),
        ...(body.executiveScore != null && { executiveScore: body.executiveScore }),
        ...(body.totalScore != null && { totalScore: body.totalScore }),
        ...(body.activities !== undefined && {
          activitiesJson: body.activities ? JSON.stringify(body.activities) : null,
        }),
      },
    });
    const actorEmail = await getActorEmail(admin.sub);
    await logDataChange({
      actorUserId: admin.sub,
      actorEmail,
      action: 'EVALUATION_UPDATE',
      entityId: id,
      summary: `${updated.facultyName} · ${updated.faculty}`,
      details: {
        before: evaluationSnapshot(existing),
        after: evaluationSnapshot(updated),
      },
    });
    const evaluation: Evaluation = evaluationToApi(updated);
    return NextResponse.json({ evaluation });
  } catch (e) {
    console.error('PATCH /api/evaluations/[id]', e);
    return NextResponse.json(
      { error: 'Failed to update evaluation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireDataEditor();
  if (admin instanceof NextResponse) return admin;
  try {
    const { id } = await params;
    const row = await prisma.evaluation.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await prisma.evaluation.delete({ where: { id } });
    const actorEmail = await getActorEmail(admin.sub);
    await logDataChange({
      actorUserId: admin.sub,
      actorEmail,
      action: 'EVALUATION_DELETE',
      entityId: id,
      summary: `${row.facultyName} · ${row.faculty}`,
      details: { deleted: evaluationSnapshot(row) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/evaluations/[id]', e);
    return NextResponse.json(
      { error: 'Failed to delete evaluation' },
      { status: 500 }
    );
  }
}
