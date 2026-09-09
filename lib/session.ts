import { SignJWT, jwtVerify } from 'jose';
import { env } from '@/lib/env';

/*
 * Session handling, kept free of `next/headers` so proxy.ts can use it too.
 * lib/auth.ts is the cookie-jar-flavoured wrapper for server components.
 */

export const SESSION_COOKIE = 'plate_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const ALGORITHM = 'HS256';

function signingKey(): Uint8Array {
  return new TextEncoder().encode(env.authSecret);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject('household')
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(signingKey());
}

/** Never throws — an absent, malformed or expired token is simply "not signed in". */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, signingKey(), { algorithms: [ALGORITHM] });
    return true;
  } catch {
    return false;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
