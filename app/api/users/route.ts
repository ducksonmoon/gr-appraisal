import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireUserManager } from '@/lib/auth-server';
import { getActorEmail, logDataChange } from '@/lib/audit-log';
import { dbRoleToApp, parseAppRole, type AppRole } from '@/lib/roles';
import type { Role } from '@prisma/client';

export async function GET() {
  const gate = await requireUserManager();
  if (gate instanceof NextResponse) return gate;

  const rows = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, role: true, createdAt: true },
  });
  return NextResponse.json({
    users: rows.map((u) => ({
      id: u.id,
      email: u.email,
      role: dbRoleToApp(u.role),
      createdAt: u.createdAt.toISOString(),
    })),
  });
}

function appRoleToDb(role: AppRole): Role {
  if (role === 'ADMIN') return 'ADMIN';
  if (role === 'MANAGER') return 'MANAGER';
  return 'VIEWER';
}

export async function POST(request: Request) {
  const gate = await requireUserManager();
  if (gate instanceof NextResponse) return gate;

  const actor = await prisma.user.findUnique({ where: { id: gate.sub } });
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      role?: string;
    };
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) {
      return NextResponse.json({ error: 'ایمیل و رمز الزامی است' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'رمز باید حداقل ۶ کاراکتر باشد' },
        { status: 400 }
      );
    }

    let targetRole: AppRole = parseAppRole(body.role) ?? 'VIEWER';
    if (actor.role === 'MANAGER') {
      targetRole = 'VIEWER';
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: 'این ایمیل قبلاً ثبت شده است' }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: bcrypt.hashSync(password, 10),
        role: appRoleToDb(targetRole),
      },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    const actorEmail = await getActorEmail(gate.sub);
    await logDataChange({
      actorUserId: gate.sub,
      actorEmail,
      action: 'USER_CREATE',
      entityId: user.id,
      summary: user.email,
      details: { role: dbRoleToApp(user.role) },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: dbRoleToApp(user.role),
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error('POST /api/users', e);
    return NextResponse.json({ error: 'ایجاد کاربر ناموفق' }, { status: 500 });
  }
}
