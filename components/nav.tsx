'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/*
 * Quiet by design. Plain links, sentence case, no arrows appended to anything,
 * and the current page marked with weight and a rule rather than a pill.
 */
const LINKS = [
  { href: '/', label: 'Log' },
  { href: '/collection', label: 'Collection' },
  { href: '/stats', label: 'Stats' },
  { href: '/gaps', label: 'Gaps' },
] as const;

export function Nav() {
  const current = usePathname();

  return (
    <nav aria-label="Sections" className="border-b border-rule">
      <ul className="flex gap-5">
        {LINKS.map((link) => {
          const active = link.href === current;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`tap -mb-px inline-block border-b-2 py-3 text-sm ${
                  active
                    ? 'border-plate-green font-semibold text-ink'
                    : 'border-transparent text-ink-soft hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
