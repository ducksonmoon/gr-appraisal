import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireUserManager } from '@/lib/auth-server';
import { getActorEmail, logDataChange } from '@/lib/audit-log';
import { dbRoleToApp, parseAppRole, type AppRole } from '@/lib/roles';
import type { Role } from '@prisma/client';

function appRoleToDb(role: AppRole): Role {
  if (role === 'ADMIN') return 'ADMIN';
  if (role === 'MANAGER') return 'MANAGER';
  return 'VIEWER';
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireUserManager();
  if (gate instanceof NextResponse) return gate;

  const actor = await prisma.user.findUnique({ where: { id: gate.sub } });
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const isSelf = id === gate.sub;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
  }

  if (!isSelf && actor.role === 'MANAGER' && target.role !== 'VIEWER') {
    return NextResponse.json({ error: 'مجاز به ویرایش این کاربر نیستید' }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      role?: string;
    };

    if (isSelf && body.role !== undefined) {
      return NextResponse.json({ error: 'تغییر نقش خود مجاز نیست' }, { status: 400 });
    }

    const data: { email?: string; passwordHash?: string; role?: Role } = {};

    if (typeof body.email === 'string') {
      const email = body.email.trim().toLowerCase();
      if (!email) {
        return NextResponse.json({ error: 'ایمیل نامعتبر است' }, { status: 400 });
      }
      const taken = await prisma.user.findFirst({
        where: { email, NOT: { id } },
      });
      if (taken) {
        return NextResponse.json({ error: 'این ایمیل قبلاً ثبت شده است' }, { status: 409 });
      }
      data.email = email;
    }

    if (typeof body.password === 'string' && body.password.length > 0) {
      if (body.password.length < 6) {
        return NextResponse.json(
          { error: 'رمز باید حداقل ۶ کاراکتر باشد' },
          { status: 400 }
        );
      }
      data.passwordHash = bcrypt.hashSync(body.password, 10);
    }

    if (!isSelf && body.role !== undefined) {
      const next = parseAppRole(body.role);
      if (!next) {
        return NextResponse.json({ error: 'نقش نامعتبر است' }, { status: 400 });
      }
      if (actor.role === 'MANAGER') {
        if (next !== 'VIEWER' || target.role !== 'VIEWER') {
          return NextResponse.json({ error: 'فقط می‌توانید نقش مشاهده‌گر را تنظیم کنید' }, { status: 403 });
        }
        data.role = 'VIEWER';
      } else {
        data.role = appRoleToDb(next);
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'فیلدی برای بروزرسانی ارسال نشده است' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, createdAt: true },
    });

    const actorEmail = await getActorEmail(gate.sub);
    await logDataChange({
      actorUserId: gate.sub,
      actorEmail,
      action: 'USER_UPDATE',
      entityId: id,
      summary: updated.email,
      details: {
        before: {
          email: target.email,
          role: dbRoleToApp(target.role),
        },
        after: {
          email: updated.email,
          role: dbRoleToApp(updated.role),
        },
        passwordChanged: Boolean(data.passwordHash),
      },
    });

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        role: dbRoleToApp(updated.role),
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error('PATCH /api/users/[id]', e);
    return NextResponse.json({ error: 'بروزرسانی ناموفق' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireUserManager();
  if (gate instanceof NextResponse) return gate;

  const actor = await prisma.user.findUnique({ where: { id: gate.sub } });
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (id === gate.sub) {
    return NextResponse.json({ error: 'حذف حساب خود مجاز نیست' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
  }

  if (actor.role === 'MANAGER' && target.role !== 'VIEWER') {
    return NextResponse.json({ error: 'مجاز به حذف این کاربر نیستید' }, { status: 403 });
  }

  try {
    const actorEmail = await getActorEmail(gate.sub);
    await logDataChange({
      actorUserId: gate.sub,
      actorEmail,
      action: 'USER_DELETE',
      entityId: id,
      summary: target.email,
      details: { role: dbRoleToApp(target.role) },
    });
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/users/[id]', e);
    return NextResponse.json({ error: 'حذف ناموفق' }, { status: 500 });
  }
}
