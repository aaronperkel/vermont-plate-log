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
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="mx-auto w-full max-w-[52rem] px-4 sm:px-6"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
      }}
    >
      <Nav />
      <main className="py-6">{children}</main>
    </div>
  );
}
