import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireDataEditor } from '@/lib/auth-server';

const PAGE_SIZE = 200;

export async function GET() {
  const gate = await requireDataEditor();
  if (gate instanceof NextResponse) return gate;

  try {
    const rows = await prisma.dataChangeLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
    });

    const logs = rows.map((l) => {
      let details: unknown = null;
      if (l.detailsJson) {
        try {
          details = JSON.parse(l.detailsJson) as unknown;
        } catch {
          details = null;
        }
      }
      return {
        id: l.id,
        actorEmail: l.actorEmail,
        action: l.action,
        entityId: l.entityId,
        summary: l.summary,
        details,
        createdAt: l.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ logs });
  } catch (e) {
    console.error('GET /api/data-logs', e);
    return NextResponse.json({ error: 'Failed to load logs' }, { status: 500 });
  }
}
