import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'ua_session';

export type JwtRole = 'ADMIN' | 'MANAGER' | 'VIEWER';

export type SessionClaims = { sub: string; role: JwtRole };

function secretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV !== 'production') {
    return new TextEncoder().encode('dev-only-secret-must-be-32-chars-min!');
  }
  throw new Error('AUTH_SECRET (min 32 characters) is required in production');
}

export async function createSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const sub = typeof payload.sub === 'string' ? payload.sub : null;
    const role = payload.role;
    if (!sub || (role !== 'ADMIN' && role !== 'MANAGER' && role !== 'VIEWER')) return null;
    return { sub, role };
  } catch {
    return null;
  }
}
