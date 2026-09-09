import type { ReactNode } from 'react';
import { Nav } from '@/components/nav';

/*
 * Shell for the four signed-in views. /login and /plate/[plate] sit outside
 * this group: one is the way in, the other is public and shareable, and
 * neither should offer navigation into pages the reader cannot open.
 *
 * Padding uses the safe-area insets because the app runs standalone with
 * viewport-fit: cover — without it the nav hides under the notch and the last
 * row of the collection sits beneath the home indicator.
 *
 * The top gets a gap on top of the inset. iOS draws the translucent status bar
 * over the page and smears what sits directly beneath it, so a nav flush to the
 * inset reads as blurred rather than as a nav. The inset clears the notch; the
 * gap clears the blur.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="mx-auto w-full max-w-[52rem] px-4 sm:px-6"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
      }}
    >
      <Nav />
      <main className="py-6">{children}</main>
    </div>
  );
}
