import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSessionToken, SESSION_COOKIE } from '@/lib/session';
import { dbRoleToApp } from '@/lib/roles';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) {
      return NextResponse.json({ error: 'ایمیل و رمز الزامی است' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return NextResponse.json({ error: 'ایمیل یا رمز اشتباه است' }, { status: 401 });
    }

    const role = dbRoleToApp(user.role);
    const token = await createSessionToken({ sub: user.id, role });

    const jar = await cookies();
    jar.set(SESSION_COOKIE, token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false',
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/auth/login', e);
    return NextResponse.json({ error: 'ورود ناموفق' }, { status: 500 });
  }
}
