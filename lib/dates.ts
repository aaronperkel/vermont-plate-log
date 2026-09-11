/*
 * Dates and times, shared by the three places that show a sighting and by the
 * log form's default date.
 *
 * Two different stored shapes arrive here. spottedAt is a date with no time —
 * the person typed it — while createdAt is a full UTC ISO timestamp written on
 * insert. They are formatted by different functions and must not be swapped.
 */

/*
 * Everything in this app happens in one place, so the zone is pinned rather
 * than read from wherever the code is running. Server components render in the
 * deployment's zone, which is UTC, and the browser renders in the phone's.
 */
const ZONE = 'America/New_York';

/*
 * Today's date in Burlington, as 'YYYY-MM-DD'. The log form's default.
 *
 * Not `toISOString().slice(0, 10)`, which is UTC: from 8pm onwards that hands
 * back tomorrow, and defaulting to the day you are actually standing in is the
 * entire job of this field. Pinning the zone also keeps the server and the
 * browser agreeing on the date, which an unpinned local reading would not — the
 * two would disagree all evening and hydrate to a mismatch.
 *
 * Takes `now` so the behaviour can be tested at a fixed instant, the same way
 * estimateIssuanceEra does.
 */
export function today(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';

  return `${part('year')}-${part('month')}-${part('day')}`;
}

/** A stored date, e.g. 'September 8, 2026'. Takes the date-only form. */
export function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** The same date at a glance, e.g. 'Sep 2026'. */
export function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/*
 * The wall-clock time a row was written, e.g. '22:14'. Takes the full
 * timestamp, and pins the zone: createdAt is stored in UTC and server
 * components render wherever the deployment happens to run, so an unpinned
 * format would put a Burlington evening at the wrong hour, or move it a day.
 * h23 rather than hour12:false, which some ICU builds render as '24:05'.
 */
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: ZONE,
  });
}
