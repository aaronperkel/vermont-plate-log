import Link from 'next/link';
import {
  CoverageGrid,
  LEGACY_PREFIX_SIZE,
  PREFIX_SIZE,
  issuedPrefixes,
  prefixRange,
  unseenRuns,
} from '@/components/coverage-grid';
import { EmptyState, Section } from '@/components/ui';
import { format } from '@/lib/plate';
import { listSightings } from '@/lib/queries/sightings';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Gaps' };

export default async function GapsPage() {
  const sightings = await listSightings();

  const counts = new Map<string, number>();
  for (const sighting of sightings) {
    const prefix = sighting.plate.slice(0, 2);
    counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
  }

  const span: [number, number] | null =
    sightings.length > 1 ? [sightings[0].ordinal, sightings[sightings.length - 1].ordinal] : null;

  const inSpan = span
    ? issuedPrefixes().filter((p) => {
        const [low, high] = prefixRange(p);
        return high >= span[0] && low <= span[1];
      })
    : [];
  const covered = inSpan.filter((p) => (counts.get(p) ?? 0) > 0).length;
  const runs = unseenRuns(counts, span);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Gaps</h1>
        <p className="mt-1 max-w-prose text-sm text-ink-soft">
          Every two-letter prefix from AA to ZZ. Each square stands for{' '}
          {LEGACY_PREFIX_SIZE.toLocaleString()} plates before late 2023 and{' '}
          {PREFIX_SIZE.toLocaleString()} after — roughly a hundred days of issuing.
        </p>
      </div>

      <Section>
        <CoverageGrid counts={counts} span={span} />
        <p className="mt-3 max-w-prose text-xs text-ink-faint">
          Filled squares are prefixes you have logged. Outlined squares fall between your earliest
          and latest plate and are still empty. Faint squares are outside that run altogether.
          Grey squares don&rsquo;t exist: Vermont did not use V or Z until late 2023, so the sequence
          stepped over them.
        </p>
      </Section>

      {sightings.length === 0 && (
        <EmptyState
          title="The map is empty"
          action={
            <Link
              href="/"
              className="tap inline-block border border-plate-green bg-plate-green px-4 py-2.5 text-sm font-semibold text-plate-white"
            >
              Log the first one
            </Link>
          }
        >
          That grid is the whole space Vermont can issue into. Log a plate and it claims a square.
        </EmptyState>
      )}

      {sightings.length === 1 && (
        <EmptyState title="One plate, no run yet">
          Coverage is measured between your earliest and latest plate, so it needs a second one
          before there is anything between them to be missing.
        </EmptyState>
      )}

      {span && (
        <Section title="What you have covered">
          <p className="max-w-prose text-sm text-ink-soft">
            Between {format(sightings[0].plate)} and {format(sightings[sightings.length - 1].plate)}{' '}
            there are {inSpan.length.toLocaleString()} prefix blocks. You have plates in{' '}
            {covered.toLocaleString()} of them.
          </p>

          {runs.length > 0 && (
            <ul className="mt-4 space-y-2">
              {runs.slice(0, 8).map((run) => (
                <li key={`${run.from}-${run.to}`} className="border-t border-rule pt-2 text-sm text-ink-soft">
                  {run.blocks === 1 ? (
                    <>
                      Nothing in {run.from} — one prefix block, about{' '}
                      {run.plates.toLocaleString()} plates.
                    </>
                  ) : (
                    <>
                      Nothing from {run.from} through {run.to} — {run.blocks} prefix blocks, about{' '}
                      {run.plates.toLocaleString()} plates.
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}
    </div>
  );
}
