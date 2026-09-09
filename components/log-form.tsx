'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plate } from '@/components/plate';
import { SequenceLine } from '@/components/sequence-line';
import { NotableBadge } from '@/components/notable-badge';
import { notableFor } from '@/lib/notable';
import { ALPHABET, estimateIssuanceEra, format, parse, toOrdinal, validate } from '@/lib/plate';
import { SPOTTERS, type Sighting, type Spotter } from '@/db/schema';

/*
 * The log screen.
 *
 * This is the screen that gets used standing next to a car, one-handed, with a
 * phone in the other hand. Everything else in the app can be a page; this has
 * to be a tool. The plate renders as you type, the ordinal and era appear
 * before you commit to anything, and the submit button sits low enough to
 * reach with a thumb.
 */

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; plate: string }
  | { kind: 'duplicate'; existing: Sighting }
  | { kind: 'error'; message: string };

const SPOTTER_LABELS: Record<Spotter, string> = { aaron: 'Aaron', riley: 'Riley' };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/*
 * The whole grammar of the field: six alphanumerics, upper case.
 *
 * Applied on the way into state rather than on the way out, so the field can
 * never hold something the plate above it is ignoring. Typing a symbol or a
 * seventh character does nothing at all, which is quieter than showing it and
 * then refusing to save it. Paste and autocorrect go through here too.
 */
function clean(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
}

/*
 * Feedback while the plate is still incomplete. A bad letter is called out the
 * moment it is typed rather than on submit — you are standing in a car park and
 * the car may be leaving.
 */
function liveError(typed: string): string | null {
  for (let i = 0; i < Math.min(typed.length, 3); i += 1) {
    if (!ALPHABET.includes(typed[i])) {
      const result = validate(`${typed.slice(0, 3).padEnd(3, 'A')}001`);
      return result.ok ? null : result.message;
    }
  }
  if (typed.length < 6) return null;
  const result = validate(typed);
  return result.ok ? null : result.message;
}

export function LogForm() {
  const router = useRouter();
  const [typed, setTyped] = useState('');
  const [spottedBy, setSpottedBy] = useState<Spotter>('aaron');
  const [spottedAt, setSpottedAt] = useState(today);
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const plate = parse(typed);
  const error = liveError(typed);
  const ready = plate !== null && validate(plate).ok;

  const preview = useMemo(() => {
    if (!ready || !plate) return null;
    return {
      ordinal: toOrdinal(plate),
      era: estimateIssuanceEra(plate),
      notable: notableFor(plate),
    };
  }, [plate, ready]);

  const marks = useMemo(
    () => (preview ? [{ ordinal: preview.ordinal, kind: 'current' as const }] : []),
    [preview],
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || !plate) return;

    setStatus({ kind: 'saving' });
    try {
      const response = await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plate, spottedBy, spottedAt, location }),
      });
      const body = await response.json();

      if (response.status === 409) {
        setStatus({ kind: 'duplicate', existing: body.existing });
        return;
      }
      if (!response.ok) {
        setStatus({ kind: 'error', message: body.error ?? 'That did not save.' });
        return;
      }

      setStatus({ kind: 'saved', plate });
      setTyped('');
      setLocation('');
      router.refresh();
    } catch {
      setStatus({ kind: 'error', message: 'Could not reach the server. Check your connection and try again.' });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex flex-col items-center pt-2">
        <Plate plate={typed} size="hero" stamped={status.kind === 'saved'} />
        <SequenceLine marks={marks} className="mt-5 w-full max-w-[25rem]" />
      </div>

      <div>
        <label htmlFor="plate" className="block text-sm font-medium text-ink">
          Plate
        </label>
        <input
          id="plate"
          value={typed}
          onChange={(e) => {
            setTyped(clean(e.target.value));
            if (status.kind !== 'idle' && status.kind !== 'saving') setStatus({ kind: 'idle' });
          }}
          /*
           * 16px minimum, or iOS Safari zooms the page when the field takes
           * focus and pushes the plate you are reading off the screen.
           */
          className="tap mt-1 w-full border border-rule bg-surface px-3 py-3 text-2xl tracking-[0.12em] text-ink outline-none focus:border-rule-strong"
          placeholder="ABC 123"
          maxLength={6}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          aria-describedby="plate-feedback"
          aria-invalid={error !== null}
        />

        <div id="plate-feedback" aria-live="polite" className="mt-2 min-h-[2.5rem] text-sm">
          {error && <p className="text-warn">{error}</p>}
          {!error && preview && (
            <div className="space-y-1">
              <p className="tnum text-ink-soft">
                Number {preview.ordinal.toLocaleString()} in the sequence. Issued{' '}
                {preview.era.label}.
              </p>
              {preview.notable && <NotableBadge notable={preview.notable} showLabel />}
            </div>
          )}
          {!error && !preview && typed.length > 0 && (
            <p className="text-ink-faint">Keep going — three letters, then three digits.</p>
          )}
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-ink">Spotted by</legend>
        <div className="mt-1 flex gap-2">
          {SPOTTERS.map((who) => (
            <button
              key={who}
              type="button"
              onClick={() => setSpottedBy(who)}
              aria-pressed={spottedBy === who}
              className={`tap flex-1 border px-4 py-2.5 text-sm ${
                spottedBy === who
                  ? 'border-plate-green bg-plate-green text-plate-white'
                  : 'border-rule bg-surface text-ink-soft'
              }`}
            >
              {SPOTTER_LABELS[who]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-ink">
            Where
          </label>
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Church Street"
            autoComplete="off"
            className="tap mt-1 w-full border border-rule bg-surface px-3 py-2.5 text-base text-ink outline-none focus:border-rule-strong"
          />
        </div>
        <div>
          <label htmlFor="spotted-at" className="block text-sm font-medium text-ink">
            When
          </label>
          <input
            id="spotted-at"
            type="date"
            value={spottedAt}
            max={today()}
            onChange={(e) => setSpottedAt(e.target.value)}
            className="tap mt-1 w-full border border-rule bg-surface px-3 py-2.5 text-base text-ink outline-none focus:border-rule-strong"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!ready || status.kind === 'saving'}
        className="tap w-full border border-plate-green bg-plate-green px-4 py-3.5 text-base font-semibold text-plate-white disabled:border-rule disabled:bg-rule disabled:text-ink-faint"
      >
        {status.kind === 'saving' ? 'Saving' : 'Add to the log'}
      </button>

      <div aria-live="polite">
        {status.kind === 'saved' && (
          <p className="text-sm text-ink-soft">
            {format(status.plate)} is in the log.{' '}
            <Link href={`/plate/${status.plate}`} className="underline underline-offset-2">
              Open its page
            </Link>
          </p>
        )}

        {status.kind === 'duplicate' && (
          <div className="animate-open">
            <div className="overflow-hidden">
              <div className="border border-warn/40 bg-surface px-4 py-3">
                <p className="text-sm font-semibold text-ink">Already logged</p>
                <p className="mt-1 text-sm text-ink-soft">
                  {SPOTTER_LABELS[status.existing.spottedBy]} recorded {format(status.existing.plate)} on{' '}
                  {new Date(`${status.existing.spottedAt}T00:00:00`).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {status.existing.location ? `, in ${status.existing.location}` : ''}.
                </p>
                <Link
                  href={`/plate/${status.existing.plate}`}
                  className="mt-2 inline-block text-sm underline underline-offset-2"
                >
                  Open its page
                </Link>
              </div>
            </div>
          </div>
        )}

        {status.kind === 'error' && <p className="text-sm text-warn">{status.message}</p>}
      </div>
    </form>
  );
}
