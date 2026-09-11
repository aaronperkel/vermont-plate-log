import { describe, expect, it } from 'vitest';
import { longDate, today } from './dates';

/*
 * The log form defaults its date field to today, and "today" is the day in
 * Burlington, not the day in UTC. The two disagree every evening.
 */
describe('today', () => {
  it('is the Burlington date through the evening, not the UTC one', () => {
    // 21:39 EDT on 10 September is already the 11th in UTC.
    expect(today(new Date('2026-09-11T01:39:00Z'))).toBe('2026-09-10');
    // And right up to the edge: 23:59 EDT is 03:59 UTC the next day.
    expect(today(new Date('2026-09-11T03:59:00Z'))).toBe('2026-09-10');
  });

  it('follows the offset change rather than assuming one', () => {
    // 21:30 EST in January — a five-hour offset, not four.
    expect(today(new Date('2026-01-15T02:30:00Z'))).toBe('2026-01-14');
  });

  it('agrees with UTC during the day, when the two do not diverge', () => {
    expect(today(new Date('2026-09-10T16:00:00Z'))).toBe('2026-09-10');
  });

  it('pads to the stored shape, so it round-trips through the date input', () => {
    const value = today(new Date('2026-01-05T17:00:00Z'));
    expect(value).toBe('2026-01-05');
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // The same shape longDate reads back, so a defaulted date renders correctly.
    expect(longDate(value)).toBe('January 5, 2026');
  });
});
