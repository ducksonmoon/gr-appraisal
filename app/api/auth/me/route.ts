import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, unauthorized } from '@/lib/auth-server';
import { dbRoleToApp } from '@/lib/roles';

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, role: true },
  });
  if (!user) return unauthorized();

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: dbRoleToApp(user.role),
    },
  });
}
