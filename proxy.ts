import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

/*
 * The password gate. Next 16 renamed middleware.ts to proxy.ts; same job.
 *
 * Deny by default, with two deliberate holes:
 *
 *   /login and its API      obviously, or nobody can get in
 *   /plate/[plate]          so a shared link previews and opens
 *
 * A plate page shows one plate, its era estimate, and the first name of
 * whoever logged it. It renders for any valid plate whether or not it has been
 * spotted, so the URL space reveals nothing about what is in the collection,
 * and there is no listing or navigation out of it into the gated views.
 * Without this hole a shared link is a login wall and iMessage cannot fetch the
 * Open Graph card, which makes the share button pointless.
 */

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];
const PUBLIC_PREFIXES = ['/plate'];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.some((path) => pathname === path)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  if (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  /*
   * A fetch() caller cannot follow a redirect to an HTML login page usefully,
   * so the API gets a status it can branch on and pages get the redirect.
   */
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Sign in first.' },
      { status: 401, headers: { 'cache-control': 'no-store' } },
    );
  }

  const url = new URL('/login', request.url);
  const target = `${pathname}${request.nextUrl.search}`;
  if (target && target !== '/') url.searchParams.set('next', target);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|ttf|woff2)$).*)',
  ],
};
