import { cookies } from 'next/headers';
import type { Spotter } from '@/db/schema';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

export {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  sessionCookieOptions,
  verifySessionToken,
} from '@/lib/session';

/**
 * Who is signed in, for server components and route handlers. proxy.ts uses
 * lib/session directly. This is the only source for `spotted_by`.
 */
export async function currentSpotter(): Promise<Spotter | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

export async function isSignedIn(): Promise<boolean> {
  return (await currentSpotter()) !== null;
}
