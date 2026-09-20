import { describe, expect, it } from 'vitest';
import { sightingUpdateSchema } from './validation';

/*
 * The one seam in the edit path that is a pure function. Everything else it
 * touches is a route handler or a component, and this repo has no harness for
 * either.
 */
describe('sightingUpdateSchema', () => {
  it('trims, so a note is never stored with the whitespace a phone added', () => {
    const parsed = sightingUpdateSchema.parse({ notes: '  Ski rack in October.  ' });
    expect(parsed.notes).toBe('Ski rack in October.');
  });

  /*
   * Clearing a note is an edit like any other. The field stays required so
   * that a body which simply omits it is a mistake rather than a silent wipe;
   * the route turns the empty string into the null an unwritten note already
   * has.
   */
  it('accepts an empty note, which is how one is cleared', () => {
    expect(sightingUpdateSchema.parse({ notes: '' }).notes).toBe('');
    expect(sightingUpdateSchema.parse({ notes: '   ' }).notes).toBe('');
  });

  it('rejects a body with no note at all', () => {
    expect(sightingUpdateSchema.safeParse({}).success).toBe(false);
  });

  /*
   * Measured after trimming, matching the field the form clamps with
   * maxLength. The message is written out because parseJsonBody surfaces the
   * first issue's message verbatim and zod's default reads like a stack trace.
   */
  it('takes 500 characters and refuses 501, in the app’s own words', () => {
    expect(sightingUpdateSchema.safeParse({ notes: 'x'.repeat(500) }).success).toBe(true);

    const tooLong = sightingUpdateSchema.safeParse({ notes: 'x'.repeat(501) });
    expect(tooLong.success).toBe(false);
    expect(tooLong.error?.issues[0]?.message).toBe('A note runs to 500 characters.');
  });
});
