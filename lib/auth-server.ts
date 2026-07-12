import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  verifySessionToken,
  SESSION_COOKIE,
  type SessionClaims,
} from '@/lib/session';

export { SESSION_COOKIE };

export async function getSession(): Promise<SessionClaims | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function requireAuth(): Promise<SessionClaims | NextResponse> {
  const s = await getSession();
  if (!s) return unauthorized();
  return s;
}

/** Full data access (evaluations CRUD): ADMIN or MANAGER */
export async function requireDataEditor(): Promise<SessionClaims | NextResponse> {
  const s = await requireAuth();
  if (s instanceof NextResponse) return s;
  if (s.role !== 'ADMIN' && s.role !== 'MANAGER') return forbidden();
  return s;
}

/** List/create users (MANAGER may only create or touch VIEWER) */
export async function requireUserManager(): Promise<SessionClaims | NextResponse> {
  const s = await requireAuth();
  if (s instanceof NextResponse) return s;
  if (s.role !== 'ADMIN' && s.role !== 'MANAGER') return forbidden();
  return s;
}
