import Link from 'next/link';
import { CoverageChart } from '@/components/charts/coverage-chart';
import { FirstLetterChart } from '@/components/charts/first-letter-chart';
import { SpotterChart } from '@/components/charts/spotter-chart';
import { NotableBadge } from '@/components/notable-badge';
import { Plate } from '@/components/plate';
import { EmptyState, Figure, Section } from '@/components/ui';
import { notableFor } from '@/lib/notable';
import { ALPHABET, ANCHORS, currentRate, describeMonth, format, toOrdinal } from '@/lib/plate';
import { listSightings } from '@/lib/queries/sightings';
import { SPOTTERS, type Sighting, type Spotter } from '@/db/schema';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Stats' };

const SPOTTER_LABELS: Record<Spotter, string> = { aaron: 'Aaron', riley: 'Riley' };

export default async function StatsPage() {
  const sightings = await listSightings();

  const letters = [...ALPHABET].map((letter) => ({
    letter,
    count: sightings.filter((s) => s.plate[0] === letter).length,
  }));

  const domainMax = Math.round(toOrdinal(`${ANCHORS[ANCHORS.length - 1].block}999`) * 1.04);
  const anchorLines = ANCHORS.map((a) => ({
    ordinal: toOrdinal(`${a.block}500`),
    label: a.block,
  }));

  // Running total along the sequence. The endpoints keep the step visible.
  const coverage = [
    { ordinal: 1, total: 0 },
    ...sightings.map((s, i) => ({ ordinal: s.ordinal, total: i + 1 })),
    { ordinal: domainMax, total: sightings.length },
  ];

  const bySpotter = SPOTTERS.map((who) => {
    const theirs = sightings.filter((s) => s.spottedBy === who);
    const notables = theirs.filter((s) => notableFor(s.plate));
    return {
      who,
      name: SPOTTER_LABELS[who],
      count: theirs.length,
      /*
       * "Rarest" has no meaning in a strictly sequential series — every plate
       * is equally common. These are the two things that do mean something, and
       * each is labelled for what it actually is.
       */
      deepest: theirs[0] as Sighting | undefined,
      bestNotable: notables[0] as Sighting | undefined,
    };
  });

  if (sightings.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Stats</h1>
          <p className="mt-1 text-sm text-ink-soft">
            The sequence advances at about {Math.round(currentRate())} plates a day, measured
            between {ANCHORS[0].block} in {describeMonth(ANCHORS[0].observed)} and{' '}
            {ANCHORS[ANCHORS.length - 1].block} in{' '}
            {describeMonth(ANCHORS[ANCHORS.length - 1].observed)}.
          </p>
        </div>

        <Section title="Where the sequence has reached">
          <CoverageChart data={coverage} anchors={anchorLines} domain={[1, domainMax]} />
          <p className="mt-2 text-xs text-ink-faint">
            The dashed lines are the two blocks confirmed by sighting. Your plates will plot against
            them.
          </p>
        </Section>

        <EmptyState
          title="Nothing to count yet"
          action={
            <Link
              href="/"
              className="tap inline-block border border-plate-green bg-plate-green px-4 py-2.5 text-sm font-semibold text-plate-white"
            >
              Log the first one
            </Link>
          }
        >
          The scale above comes from the two confirmed sightings in the sequence, not from your
          collection — so it is already correct. Everything else here needs at least one plate.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Stats</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {sightings.length.toLocaleString()} {sightings.length === 1 ? 'plate' : 'plates'} logged.
          The sequence advances at about {Math.round(currentRate())} a day.
        </p>
      </div>

      <Section
        title="Where your plates sit in the sequence"
        description="A running total along Vermont's single sequential run. The dashed lines are the two blocks confirmed by sighting."
      >
        <CoverageChart data={coverage} anchors={anchorLines} domain={[1, domainMax]} />
      </Section>

      <Section
        title="By first letter"
        description="All 22 letters Vermont issues. The empty ones are the point — they show how narrow the collection still is."
      >
        <FirstLetterChart data={letters} />
      </Section>

      <Section title="Aaron and Riley">
        <SpotterChart data={bySpotter.map(({ name, count }) => ({ name, count }))} />

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {bySpotter.map((person) => (
            <div key={person.who} className="border-t border-rule pt-3">
              <Figure label={person.name} value={person.count} hint={person.count === 1 ? 'plate' : 'plates'} />

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs text-ink-soft">Deepest find</p>
                  {person.deepest ? (
                    <Link href={`/plate/${person.deepest.plate}`} className="mt-1 flex items-center gap-3">
                      <Plate plate={person.deepest.plate} size="row" />
                      <span className="tnum text-xs text-ink-faint">
                        Number {person.deepest.ordinal.toLocaleString()}
                      </span>
                    </Link>
                  ) : (
                    <p className="mt-1 text-sm text-ink-faint">Nothing yet.</p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-ink-soft">Best combination</p>
                  {person.bestNotable ? (
                    <Link href={`/plate/${person.bestNotable.plate}`} className="mt-1 block">
                      <span className="text-sm font-medium text-ink">
                        {format(person.bestNotable.plate)}
                      </span>
                      <span className="ml-2">
                        <NotableBadge notable={notableFor(person.bestNotable.plate)!} showLabel />
                      </span>
                    </Link>
                  ) : (
                    <p className="mt-1 text-sm text-ink-faint">Nothing that spells anything yet.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 max-w-prose text-xs text-ink-faint">
          There is no rarest plate in a strictly sequential series — every combination is issued
          exactly once and none is harder to make than another. Deepest find is the earliest
          position in the sequence, which is the closest thing to an old plate still on the road.
        </p>
      </Section>
    </div>
  );
}
