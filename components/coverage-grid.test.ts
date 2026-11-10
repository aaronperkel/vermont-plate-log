import { describe, expect, it } from 'vitest';
import { toOrdinal } from '@/lib/plate';
import { allPrefixes, issuedPrefixes, platesInPrefix, unseenRuns } from './coverage-grid';

function spanOf(from: string, to: string): [number, number] {
  return [toOrdinal(from), toOrdinal(to)];
}

describe('issued prefixes', () => {
  it('leaves out the pre-activation prefixes containing V or Z', () => {
    const issued = issuedPrefixes();
    expect(issued).toContain('AT');
    expect(issued).toContain('AW');
    expect(issued).not.toContain('AV');
    expect(issued).not.toContain('AZ');
    // The new letters are real from the activation on.
    expect(issued).toContain('KV');
    expect(issued).toContain('KZ');
    expect(issued.length).toBeLessThan(allPrefixes().length);
  });

  it('sizes a prefix by the alphabet it was stamped in', () => {
    expect(platesInPrefix('AW')).toBe(19_000);
    expect(platesInPrefix('AV')).toBe(0);
    expect(platesInPrefix('LA')).toBe(21_000);
  });
});

describe('unseenRuns', () => {
  it('neither counts a skipped prefix as a gap nor lets it split one', () => {
    // AT through BA in the grid is AT, AV, AW, AX, AY, AZ, BA. Only five of those were issued.
    const counts = new Map([
      ['AS', 1],
      ['BB', 1],
    ]);
    const runs = unseenRuns(counts, spanOf('ASA000', 'BBA000'));
    expect(runs).toEqual([{ from: 'AT', to: 'BA', blocks: 5, plates: 95_000 }]);
  });

  it('adds up mixed prefix sizes across the activation', () => {
    const counts = new Map([
      ['KM', 1],
      ['KR', 1],
    ]);
    const runs = unseenRuns(counts, spanOf('KMA000', 'KRA000'));
    // KN is legacy, KP is the activation prefix and counts as modern.
    expect(runs).toEqual([{ from: 'KN', to: 'KP', blocks: 2, plates: 19_000 + 21_000 }]);
  });

  it('sorts the largest run first by plates, not by cells', () => {
    const counts = new Map([
      ['AA', 1],
      ['AD', 1],
      ['KM', 1],
      ['KS', 1],
    ]);
    const runs = unseenRuns(counts, spanOf('AAA000', 'KSA000'));
    expect(runs[0].plates).toBeGreaterThanOrEqual(runs[runs.length - 1].plates);
  });
});
