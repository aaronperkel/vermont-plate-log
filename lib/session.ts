import { SignJWT, jwtVerify } from 'jose';
import { SPOTTERS, type Spotter } from '@/db/schema';
import { env } from '@/lib/env';

/*
 * Session handling, kept free of `next/headers` so proxy.ts can use it too.
 * lib/auth.ts is the cookie-jar-flavoured wrapper for server components.
 *
 * The token's subject is who signed in. One password is shared, but the name
 * typed beside it is the identity, and the API stamps `spotted_by` from here
 * rather than from anything the form sends. Before October 2026 the subject
 * was the fixed string 'household'; those tokens no longer verify, which is
 * the one-time sign-in each phone did after that deploy.
 */

export const SESSION_COOKIE = 'plate_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const ALGORITHM = 'HS256';

function signingKey(): Uint8Array {
  return new TextEncoder().encode(env.authSecret);
}

export async function createSessionToken(spotter: Spotter): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(spotter)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(signingKey());
}

function isSpotter(value: unknown): value is Spotter {
  return typeof value === 'string' && (SPOTTERS as readonly string[]).includes(value);
}

/**
 * Who the token belongs to, or null. Never throws — an absent, malformed,
 * expired or unrecognised token is simply "not signed in".
 */
export async function verifySessionToken(token: string | undefined | null): Promise<Spotter | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), { algorithms: [ALGORITHM] });
    return isSpotter(payload.sub) ? payload.sub : null;
  } catch {
    return null;
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
