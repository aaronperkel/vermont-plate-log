import { z } from 'zod';
import { SPOTTERS } from '@/db/schema';
import { jsonError, jsonOk, parseJsonBody, withErrorHandling } from '@/lib/api';
import { passwordMatches } from '@/lib/password';
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from '@/lib/session';

/*
 * The name is whichever of the two people is signing in; the password is the
 * one they share. The name is validated loosely on purpose — a wrong name and
 * a wrong password both come back as the same 401, so the form has one
 * message and the response never confirms which half was right.
 */
const loginSchema = z.object({
  username: z.string().trim().toLowerCase(),
  password: z.string().min(1, 'Enter the password.'),
});

const rejected = () => jsonError('That name or password is not right.', 401);

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await parseJsonBody(request, loginSchema);
    if (!body.ok) return body.response;

    const spotter = SPOTTERS.find((who) => who === body.data.username);
    const passwordOk = passwordMatches(body.data.password);
    if (!spotter || !passwordOk) return rejected();

    const response = jsonOk({ ok: true, spotter });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(spotter), sessionCookieOptions());
    return response;
  });
}
