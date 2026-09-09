import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Plate } from '@/components/plate';
import { NotableBadge } from '@/components/notable-badge';
import { SequenceLine } from '@/components/sequence-line';
import { ShareButton } from '@/components/share-button';
import { notableFor } from '@/lib/notable';
import { estimateIssuanceEra, format, parse, toOrdinal, validate } from '@/lib/plate';
import { findByPlate } from '@/lib/queries/sightings';
import type { Sighting } from '@/db/schema';

export const dynamic = 'force-dynamic';

const SPOTTERS: Record<string, string> = { aaron: 'Aaron', riley: 'Riley' };

/*
 * Public, unlike the rest of the app, so a shared link previews and opens.
 *
 * It renders for any valid plate whether or not anyone has logged it, which is
 * what makes it safe to leave open: the URL space says nothing about what is in
 * the collection, and there is no way from here into the gated views.
 */

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

async function load(raw: string): Promise<{ plate: string; sighting: Sighting | null }> {
  const plate = parse(decodeURIComponent(raw));
  if (!plate || !validate(plate).ok) notFound();
  return { plate, sighting: await findByPlate(plate) };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ plate: string }>;
}): Promise<Metadata> {
  const { plate, sighting } = await load((await params).plate);
  const pretty = format(plate);

  const description = sighting
    ? `Spotted by ${SPOTTERS[sighting.spottedBy]}${sighting.location ? ` at ${sighting.location}` : ''}, ${shortDate(sighting.spottedAt)}`
    : `Number ${toOrdinal(plate).toLocaleString()} in Vermont's passenger sequence. Not spotted yet.`;

  return {
    title: pretty,
    description,
    openGraph: { title: `${pretty} — Plate log`, description, type: 'article' },
    twitter: { card: 'summary_large_image', title: `${pretty} — Plate log`, description },
  };
}

export default async function PlatePage({ params }: { params: Promise<{ plate: string }> }) {
  const { plate, sighting } = await load((await params).plate);
  const ordinal = toOrdinal(plate);
  const era = estimateIssuanceEra(plate);
  const notable = notableFor(plate);

  return (
    <div
      className="mx-auto w-full max-w-[36rem] px-4 sm:px-6"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 2rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)',
      }}
    >
      <div className="flex flex-col items-center">
        <Plate plate={plate} size="detail" />
        <SequenceLine marks={[{ ordinal, kind: 'current' }]} className="mt-6 w-full max-w-[33rem]" />
      </div>

      <div className="mt-8 space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-ink">{format(plate)}</h1>
          {notable && (
            <div className="mt-2">
              <NotableBadge notable={notable} showLabel />
            </div>
          )}
        </div>

        <dl className="space-y-3 border-t border-rule pt-4 text-sm">
          <div className="flex justify-between gap-6">
            <dt className="text-ink-soft">Position in the sequence</dt>
            <dd className="tnum font-medium text-ink">{ordinal.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-ink-soft">Issued</dt>
            <dd className="text-right font-medium text-ink">{era.label}</dd>
          </div>
        </dl>

        <p className="max-w-prose text-xs leading-relaxed text-ink-faint">{era.caveat}</p>

        <div className="border-t border-rule pt-4">
          {sighting ? (
            <p className="text-sm text-ink-soft">
              Spotted by{' '}
              <span className="font-medium text-ink">{SPOTTERS[sighting.spottedBy]}</span>
              {sighting.location ? ` at ${sighting.location}` : ''} on {longDate(sighting.spottedAt)}.
              {sighting.notes ? ` ${sighting.notes}` : ''}
            </p>
          ) : (
            <p className="text-sm text-ink-soft">Nobody has logged this one.</p>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-rule pt-4">
          <ShareButton url={`/plate/${plate}`} title={`${format(plate)} — Plate log`} />
          <Link href="/" className="text-sm text-ink-soft underline underline-offset-2">
            Open the log
          </Link>
        </div>
      </div>
    </div>
  );
}
