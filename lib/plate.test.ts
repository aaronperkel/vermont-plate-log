import { describe, expect, it } from 'vitest';
import {
  ALPHABET,
  ANCHORS,
  BLOCK_SIZE,
  LEGACY_ALPHABET,
  SEQUENCE_SIZE,
  SERIES_START_MONTH,
  blockOf,
  containsPostActivationLetter,
  estimateIssuanceEra,
  format,
  fromOrdinal,
  parse,
  toLegacyOrdinal,
  toOrdinal,
  validate,
} from './plate';

describe('the alphabet', () => {
  it('has 22 letters and excludes I, J, O and Q', () => {
    expect(ALPHABET).toHaveLength(22);
    for (const letter of 'IJOQ') expect(ALPHABET).not.toContain(letter);
  });

  it('legacy is the modern alphabet minus U, V and Z', () => {
    expect(LEGACY_ALPHABET).toHaveLength(19);
    expect([...ALPHABET].filter((l) => !'UVZ'.includes(l)).join('')).toBe(LEGACY_ALPHABET);
  });

  it('keeps the new letters in alphabetical position rather than appended', () => {
    // The whole ordinal quirk depends on this. If U ever moves to the end, the
    // "AAU 001 looks early" behaviour disappears and this test should fail.
    expect(ALPHABET.indexOf('U')).toBeLessThan(ALPHABET.indexOf('W'));
    expect(ALPHABET.indexOf('Z')).toBe(ALPHABET.length - 1);
    expect([...ALPHABET].every((l, i, a) => i === 0 || a[i - 1] < l)).toBe(true);
  });
});

describe('parse', () => {
  it('normalises every shape a person might type', () => {
    for (const input of ['lax123', 'LAX 123', 'LAX-123', 'lax_123', '  LaX  123  ', 'LAX.123']) {
      expect(parse(input)).toBe('LAX123');
    }
  });

  it('rejects anything that is not three letters then three digits', () => {
    for (const input of ['', 'LAX', '123', 'LAX12', 'LAX1234', 'LA1234', '12LAX3', 'nonsense']) {
      expect(parse(input)).toBeNull();
    }
  });

  it('checks shape only, leaving domain rules to validate', () => {
    expect(parse('abo123')).toBe('ABO123');
    expect(validate('ABO123').ok).toBe(false);
  });
});

describe('validate', () => {
  it('names the offending letter and its position', () => {
    const result = validate('ABO123');
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.message).toContain('third');
    expect(result.message).toContain('O');
    expect(result.message).toContain('0');
  });

  it.each([
    ['IAA123', 'I'],
    ['JAA123', 'J'],
    ['OAA123', 'O'],
    ['QAA123', 'Q'],
  ])('rejects %s because of %s', (plate, letter) => {
    const result = validate(plate);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.message).toContain(letter);
  });

  it('accepts the whole 000 to 999 run', () => {
    // 000 was rejected until a KXB 000 sighting in September 2026. See BLOCK_SIZE.
    expect(validate('LAX000').ok).toBe(true);
    expect(validate('LAX001').ok).toBe(true);
    expect(validate('LAX999').ok).toBe(true);
  });

  it('accepts the post-activation letters', () => {
    for (const plate of ['AAU001', 'AAV001', 'AAZ001', 'UVZ999']) {
      expect(validate(plate).ok).toBe(true);
    }
  });
});

describe('ordinals', () => {
  it('starts at 1 and ends at the sequence size', () => {
    expect(toOrdinal('AAA000')).toBe(1);
    expect(toOrdinal('AAA001')).toBe(2);
    expect(toOrdinal('ZZZ999')).toBe(SEQUENCE_SIZE);
    expect(SEQUENCE_SIZE).toBe(22 ** 3 * 1000);
  });

  it('uses 1000 plates per block, and 000 is the first of them', () => {
    expect(BLOCK_SIZE).toBe(1000);
    expect(toOrdinal('AAB001') - toOrdinal('AAA001')).toBe(1000);
    // 000 sorts directly below its own 001 and directly above the block below.
    expect(toOrdinal('AAB000') - toOrdinal('AAA999')).toBe(1);
  });

  it('round-trips through fromOrdinal', () => {
    const samples = [1, 2, 999, 1000, 1001, 15_985, 4_153_294, 4_370_748, SEQUENCE_SIZE];
    for (const ordinal of samples) {
      expect(toOrdinal(fromOrdinal(ordinal))).toBe(ordinal);
    }
  });

  it('increases strictly across a hand-ordered list', () => {
    const ordered = ['AAA000', 'AAA001', 'AAA002', 'AAA999', 'AAB000', 'AAB001', 'AAU001', 'AAZ999', 'ABA001', 'KPZ451', 'KXB000', 'LAX123', 'ZZZ999'];
    const ordinals = ordered.map(toOrdinal);
    for (let i = 1; i < ordinals.length; i += 1) {
      expect(ordinals[i]).toBeGreaterThan(ordinals[i - 1]);
    }
  });

  it('rejects out-of-range ordinals', () => {
    expect(() => fromOrdinal(0)).toThrow();
    expect(() => fromOrdinal(SEQUENCE_SIZE + 1)).toThrow();
    expect(() => fromOrdinal(1.5)).toThrow();
  });

  it('throws rather than returning nonsense for an invalid plate', () => {
    expect(() => toOrdinal('ABO123')).toThrow(/not a vermont plate/i);
  });
});

describe('the legacy ordinal', () => {
  it('is null for plates containing U, V or Z', () => {
    for (const plate of ['AAU001', 'AAV001', 'AAZ001', 'KPZ451']) {
      expect(toLegacyOrdinal(plate)).toBeNull();
      expect(containsPostActivationLetter(plate)).toBe(true);
    }
  });

  it('counts fewer plates than the modern ordinal, because U/V/Z blocks never issued', () => {
    // The gap is the whole point: modern ordinals overcount the past.
    const modern = toOrdinal('KPA001');
    const legacy = toLegacyOrdinal('KPA001');
    expect(legacy).not.toBeNull();
    expect(legacy!).toBeLessThan(modern);
    expect(modern - legacy!).toBeGreaterThan(1_000_000);
  });

  it('agrees with the modern ordinal at the very start', () => {
    expect(toLegacyOrdinal('AAA000')).toBe(toOrdinal('AAA000'));
    expect(toLegacyOrdinal('AAA001')).toBe(toOrdinal('AAA001'));
  });
});

describe('anchors', () => {
  it('are strictly increasing in both ordinal and date', () => {
    // estimateIssuanceEra brackets against this. Appending an out-of-order
    // anchor would silently produce negative rates.
    for (let i = 1; i < ANCHORS.length; i += 1) {
      const previous = ANCHORS[i - 1];
      const current = ANCHORS[i];
      expect(toOrdinal(`${current.block}500`)).toBeGreaterThan(toOrdinal(`${previous.block}500`));
      expect(current.observed > previous.observed).toBe(true);
    }
  });

  it('reference real blocks', () => {
    for (const anchor of ANCHORS) {
      expect(anchor.block).toHaveLength(3);
      expect(validate(`${anchor.block}001`).ok).toBe(true);
      expect(anchor.observed).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it('hold no plate strings, so none can be mistaken for a sighting', () => {
    for (const anchor of ANCHORS) {
      expect(Object.keys(anchor)).toEqual(['block', 'observed', 'note']);
    }
  });
});

describe('estimateIssuanceEra', () => {
  const now = new Date('2026-09-09T00:00:00Z');

  it('flags the U/V/Z contradiction instead of returning a 1990s date', () => {
    const era = estimateIssuanceEra('AAU001', now);
    expect(era.confidence).toBe('contradictory');
    expect(era.earliest >= '2023-11').toBe(true);
    expect(era.caveat).toContain('U');
    // The ordinal really is near the start — that is what makes it a trap.
    expect(toOrdinal('AAU001')).toBeLessThan(20_000);
  });

  it('interpolates between the anchors', () => {
    const era = estimateIssuanceEra('KYG499', now);
    expect(era.confidence).toBe('interpolated');
    expect(era.earliest > ANCHORS[0].observed).toBe(true);
    expect(era.latest < '2026-12').toBe(true);
  });

  it('projects past the newest anchor', () => {
    const era = estimateIssuanceEra('LBA001', now);
    expect(era.confidence).toBe('projected');
    expect(era.earliest >= '2026-01').toBe(true);
  });

  it('is speculative before the oldest anchor', () => {
    const era = estimateIssuanceEra('BAA001', now);
    expect(era.confidence).toBe('speculative');
    expect(era.caveat).toContain('19-letter');
  });

  it('never returns a date before the series began', () => {
    for (const plate of ['AAA001', 'AAB001', 'ABA001', 'BAA001']) {
      expect(estimateIssuanceEra(plate, now).earliest >= SERIES_START_MONTH).toBe(true);
    }
  });

  it('always returns a range, a label and a caveat', () => {
    for (const plate of ['AAA001', 'AAU001', 'KYG499', 'LBA001', 'ZZZ999']) {
      const era = estimateIssuanceEra(plate, now);
      expect(era.earliest <= era.latest).toBe(true);
      expect(era.label.length).toBeGreaterThan(0);
      expect(era.caveat.length).toBeGreaterThan(0);
      expect(era.label).not.toMatch(/\d{4}-\d{2}/); // never a bare machine date
    }
  });

  it('does not call the anchor observations themselves contradictory', () => {
    // KPZ 451 and the KPV series were seen at the activation. A block midpoint
    // sits above half its own block, so comparing against it rather than
    // against the activation zone flags the anchor plate as impossible.
    for (const plate of ['KPU100', 'KPV001', 'KPZ451', 'KPZ999']) {
      const era = estimateIssuanceEra(plate, now);
      expect(era.confidence).toBe('interpolated');
      expect(era.earliest <= '2023-11' && era.latest >= '2023-11').toBe(true);
    }
  });

  it('places the whole activation prefix around the activation month', () => {
    const era = estimateIssuanceEra('KPA001', now);
    expect(era.confidence).toBe('interpolated');
    expect(era.latest >= '2023-09').toBe(true);
  });

  it('covers all four regimes', () => {
    const seen = new Set(
      ['AAU001', 'BAA001', 'KYG499', 'LBA001'].map((p) => estimateIssuanceEra(p, now).confidence),
    );
    expect(seen).toEqual(new Set(['contradictory', 'speculative', 'interpolated', 'projected']));
  });
});

describe('formatting', () => {
  it('spaces for display and reports the block', () => {
    expect(format('LAX123')).toBe('LAX 123');
    expect(blockOf('LAX123')).toBe('LAX');
  });
});
