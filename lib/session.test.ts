import { SignJWT } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { createSessionToken, verifySessionToken } from './session';

/*
 * The one thing the session has to get right: a token says who signed in, and
 * nothing else verifies. The subject used to be the fixed string 'household',
 * and those tokens must now read as signed out rather than as somebody.
 */
const SECRET = 'test-secret-that-is-long-enough-for-hs256';

async function tokenWithSubject(subject: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(SECRET));
}

describe('session tokens', () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = SECRET;
  });

  it('round-trips the person who signed in', async () => {
    expect(await verifySessionToken(await createSessionToken('riley'))).toBe('riley');
    expect(await verifySessionToken(await createSessionToken('aaron'))).toBe('aaron');
  });

  it('treats the old household subject as signed out', async () => {
    expect(await verifySessionToken(await tokenWithSubject('household'))).toBeNull();
  });

  it('rejects a name that is not one of the two people, even when correctly signed', async () => {
    expect(await verifySessionToken(await tokenWithSubject('bob'))).toBeNull();
    expect(await verifySessionToken(await tokenWithSubject('Riley'))).toBeNull();
  });

  it('never throws on garbage or nothing', async () => {
    expect(await verifySessionToken(undefined)).toBeNull();
    expect(await verifySessionToken('')).toBeNull();
    expect(await verifySessionToken('not.a.jwt')).toBeNull();
  });

  it('rejects a token signed with a different key', async () => {
    const forged = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('aaron')
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode('some-other-secret-of-sufficient-length'));
    expect(await verifySessionToken(forged)).toBeNull();
  });
});
