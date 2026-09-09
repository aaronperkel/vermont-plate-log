import { describe, expect, it } from 'vitest';
import { ALPHABET, validate } from './plate';
import { CATEGORY_LABELS, NOTABLE, NOTABLE_CATEGORIES, isNotable, notableFor } from './notable';

describe('the notable list', () => {
  /*
   * The important one. It is very easy to add an entry containing I, J, O or Q
   * — LOL, API, JFK all feel like obvious inclusions — and such an entry can
   * never match anything, so nothing else in the app would ever surface the
   * mistake.
   */
  it('contains only combinations Vermont can actually issue', () => {
    const illegal = Object.keys(NOTABLE).filter((key) => !validate(`${key}001`).ok);
    expect(illegal).toEqual([]);
  });

  it('has three-letter keys drawn from the alphabet', () => {
    for (const key of Object.keys(NOTABLE)) {
      expect(key).toHaveLength(3);
      expect(key).toBe(key.toUpperCase());
      for (const letter of key) expect(ALPHABET).toContain(letter);
    }
  });

  it('ships a useful number of entries', () => {
    expect(Object.keys(NOTABLE).length).toBeGreaterThanOrEqual(60);
  });

  it('uses only declared categories, and every category is used', () => {
    const used = new Set(Object.values(NOTABLE).map((entry) => entry.category));
    for (const category of used) expect(NOTABLE_CATEGORIES).toContain(category);
    for (const category of NOTABLE_CATEGORIES) expect(used).toContain(category);
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual([...NOTABLE_CATEGORIES].sort());
  });

  it('gives every entry a non-empty label', () => {
    for (const [key, entry] of Object.entries(NOTABLE)) {
      expect(entry.label.length, `${key} needs a label`).toBeGreaterThan(0);
    }
  });

  it('marks some combinations theoretical, and none of them casually', () => {
    const theoretical = Object.entries(NOTABLE).filter(([, e]) => e.theoretical);
    expect(theoretical.length).toBeGreaterThan(0);
    expect(theoretical.length).toBeLessThan(Object.keys(NOTABLE).length / 4);
  });
});

describe('lookup', () => {
  it('matches on a full plate or a bare block', () => {
    expect(notableFor('LAX123')?.category).toBe('airport');
    expect(notableFor('LAX')?.label).toBe('Los Angeles');
    expect(isNotable('BTV001')).toBe(true);
  });

  it('returns null for anything uncurated', () => {
    expect(notableFor('KRB123')).toBeNull();
    expect(isNotable('KRB123')).toBe(false);
  });
});
