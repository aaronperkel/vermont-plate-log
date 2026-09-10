/*
 * Rendering dates and times, shared by the three places that show a sighting.
 *
 * Two different stored shapes arrive here. spottedAt is a date with no time —
 * the person typed it — while createdAt is a full UTC ISO timestamp written on
 * insert. They are formatted by different functions and must not be swapped.
 */

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
    timeZone: 'America/New_York',
  });
}
