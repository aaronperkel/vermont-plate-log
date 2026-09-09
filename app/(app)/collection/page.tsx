import Link from 'next/link';
import { Plate } from '@/components/plate';
import { NotableBadge } from '@/components/notable-badge';
import { EmptyState, Section } from '@/components/ui';
import { notableFor } from '@/lib/notable';
import { estimateIssuanceEra, format } from '@/lib/plate';
import { listSightings } from '@/lib/queries/sightings';
import { SPOTTERS, type Sighting, type Spotter } from '@/db/schema';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Collection' };

const SPOTTER_LABELS: Record<Spotter, string> = { aaron: 'Aaron', riley: 'Riley' };

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** One sentence of context. No middle-dot-separated fragments. */
function describe(sighting: Sighting): string {
  const where = sighting.location ? ` at ${sighting.location}` : '';
  return `${SPOTTER_LABELS[sighting.spottedBy]} spotted this${where} on ${longDate(sighting.spottedAt)}.`;
}

function Row({ sighting }: { sighting: Sighting }) {
  const notable = notableFor(sighting.plate);

  return (
    <li className="border-b border-rule py-4 last:border-b-0">
      <Link href={`/plate/${sighting.plate}`} className="flex items-start gap-4">
        <Plate plate={sighting.plate} size="row" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-semibold text-ink">{format(sighting.plate)}</span>
            <span className="tnum text-xs text-ink-faint">
              Number {sighting.ordinal.toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">{describe(sighting)}</p>
          {notable && (
            <div className="mt-2">
              <NotableBadge notable={notable} />
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={`tap inline-flex items-center border px-2.5 py-1.5 text-sm ${
        active ? 'border-plate-green text-plate-green' : 'border-rule text-ink-soft'
      }`}
    >
      {children}
    </Link>
  );
}

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ by?: string; spells?: string }>;
}) {
  const { by, spells } = await searchParams;
  const all = await listSightings();

  const spotter = SPOTTERS.find((s) => s === by);
  const onlyNotable = spells === 'yes';

  const shown = all.filter((s) => {
    if (spotter && s.spottedBy !== spotter) return false;
    if (onlyNotable && !notableFor(s.plate)) return false;
    return true;
  });

  // Sorted by ordinal already; the extremes are simply the ends.
  const oldest = shown[0];
  const newest = shown[shown.length - 1];
  const query = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { by: spotter, spells: onlyNotable ? 'yes' : undefined, ...next };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const q = params.toString();
    return q ? `/collection?${q}` : '/collection';
  };

  if (all.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-ink">Collection</h1>
        <EmptyState
          title="No plates yet"
          action={
            <Link
              href="/"
              className="tap inline-block border border-plate-green bg-plate-green px-4 py-2.5 text-sm font-semibold text-plate-white"
            >
              Log the first one
            </Link>
          }
        >
          Everything you log shows up here, ordered by where it falls in Vermont&rsquo;s issuing
          sequence rather than by when you saw it — so the list reads oldest plate first, not
          oldest entry first.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Collection</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {all.length.toLocaleString()} {all.length === 1 ? 'plate' : 'plates'}, ordered by position
          in the sequence.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterLink href={query({ by: undefined })} active={!spotter}>
          Everyone
        </FilterLink>
        {SPOTTERS.map((who) => (
          <FilterLink key={who} href={query({ by: who })} active={spotter === who}>
            {SPOTTER_LABELS[who]}
          </FilterLink>
        ))}
        <FilterLink href={query({ spells: onlyNotable ? undefined : 'yes' })} active={onlyNotable}>
          Spells something
        </FilterLink>
      </div>

      {shown.length === 0 ? (
        <EmptyState title="Nothing matches those filters">
          Try widening them — or log a plate that fits.
        </EmptyState>
      ) : (
        <>
          {/*
            The ends of the run, pinned. Suppressed below two sightings, where
            the oldest and the newest are the same plate and pinning it twice
            would be nonsense.
          */}
          {shown.length > 1 && (
            <Section title="The ends of your run">
              <ul>
                <Row sighting={oldest} />
                <Row sighting={newest} />
              </ul>
              <p className="mt-2 text-xs text-ink-faint">
                {format(oldest.plate)} is the earliest position you have, issued{' '}
                {estimateIssuanceEra(oldest.plate).label}. {format(newest.plate)} is the latest.
              </p>
            </Section>
          )}

          <Section title={shown.length === all.length ? 'Every plate' : `${shown.length} matching`}>
            <ul>
              {shown.map((sighting) => (
                <Row key={sighting.id} sighting={sighting} />
              ))}
            </ul>
          </Section>
        </>
      )}
    </div>
  );
}
