'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field } from '@/components/ui';
import { format } from '@/lib/plate';
import type { Sighting } from '@/db/schema';

/*
 * Correcting a sighting after the fact, from the plate's own page.
 *
 * Only ever the note. The plate itself is never edited, because `ordinal` is
 * derived from it on insert and nothing rewrites it — a plate read wrong is
 * removed and logged again, which the unique index makes possible the moment
 * the row is gone.
 *
 * The page around this is public so shared links preview, and it decides
 * whether to mount this at all. Nothing here is a permission check.
 *
 * Nothing here animates either. Motion in this app answers an action in
 * exactly two places, confirming a save and revealing a duplicate; a third
 * would turn it into decoration.
 */

type Mode = 'idle' | 'editing' | 'confirming' | 'removed';

const QUIET = 'tap border border-rule bg-surface px-3 py-2 text-sm hover:border-rule-strong disabled:border-rule disabled:text-ink-faint';
const STRONG = 'tap border px-4 py-2 text-sm font-semibold disabled:border-rule disabled:bg-rule disabled:text-ink-faint';

export function SightingActions({ sighting }: { sighting: Sighting }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('idle');
  const [draft, setDraft] = useState(sighting.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * Seeded when the editor opens rather than only on mount, so a note changed
   * on the other phone and pulled in by a refresh cannot sit behind the button
   * as a stale draft waiting to overwrite it.
   */
  function openEditor() {
    setDraft(sighting.notes ?? '');
    setError(null);
    setMode('editing');
  }

  async function send(method: 'PATCH' | 'DELETE', fallback: string, body?: unknown): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/sightings/${sighting.id}`, {
        method,
        ...(body === undefined
          ? {}
          : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error ?? fallback);
        setBusy(false);
        return false;
      }

      router.refresh();
      return true;
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setBusy(false);
      return false;
    }
  }

  async function saveNote(event: React.FormEvent) {
    event.preventDefault();
    if (await send('PATCH', 'That note did not save.', { notes: draft })) {
      setBusy(false);
      setMode('idle');
    }
  }

  /*
   * Stays busy on success and renders nothing from here on. The refresh that
   * replaces this page is a round trip, and a button that comes back to life
   * in the meantime can be pressed a second time against an id that is gone.
   */
  async function remove() {
    if (await send('DELETE', 'That did not come out of the log.')) setMode('removed');
  }

  if (mode === 'removed') return null;

  return (
    <div className="border-t border-rule pt-4">
      {mode === 'editing' && (
        <form onSubmit={saveNote} className="space-y-3">
          <Field label="Note" htmlFor="note" hint="Only the two of you can see this.">
            {/*
              Focused on open, because the button that opened it has just
              stopped existing and focus would otherwise fall to the body.
              Tapping "Add a note" on a phone should also put the keyboard up.
            */}
            <textarea
              autoFocus
              id="note"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Anything worth remembering about this one."
              className="mt-1 w-full resize-y bg-transparent text-base text-ink outline-none"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              className={`${STRONG} border-plate-green bg-plate-green text-plate-white`}
            >
              {busy ? 'Saving' : 'Save note'}
            </button>
            <button type="button" disabled={busy} onClick={() => setMode('idle')} className={`${QUIET} text-ink`}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === 'confirming' && (
        <div className="border border-warn/40 bg-surface px-4 py-3">
          <p className="text-sm font-semibold text-ink">Remove {format(sighting.plate)}?</p>
          <p className="mt-1 text-sm text-ink-soft">
            It leaves the collection and the charts, and the note goes with it. You can log it
            again afterwards, which is how a plate read wrong gets fixed.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {/*
              Outlined, not filled. The plate is the only place this app spends
              colour, and a solid block of warn next to it would compete.
            */}
            <button
              type="button"
              disabled={busy}
              onClick={remove}
              className={`${STRONG} border-warn bg-surface text-warn`}
            >
              {busy ? 'Removing' : 'Remove'}
            </button>
            {/* Focus lands on the safe option, for the same reason. */}
            <button
              autoFocus
              type="button"
              disabled={busy}
              onClick={() => setMode('idle')}
              className={`${QUIET} text-ink`}
            >
              Keep it
            </button>
          </div>
        </div>
      )}

      {mode === 'idle' && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={openEditor} className={`${QUIET} text-ink`}>
            {sighting.notes ? 'Edit note' : 'Add a note'}
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode('confirming');
            }}
            className={`${QUIET} text-warn`}
          >
            Remove sighting
          </button>
        </div>
      )}

      <div aria-live="polite">{error && <p className="mt-2 text-sm text-warn">{error}</p>}</div>
    </div>
  );
}
