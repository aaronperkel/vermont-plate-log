import { describe, expect, it } from 'vitest';
import { estimateIssuanceEra, toOrdinal } from '@/lib/plate';
import { recordFor } from './record';

describe('recordFor', () => {
  const collection = ['GHK123', 'HAB456', 'KXY789'];

  it('calls the only plate in an empty collection the first', () => {
    expect(recordFor('GHK123', [])).toBe('first');
  });

  it('spots a new oldest', () => {
    expect(recordFor('BCD001', collection)).toBe('oldest');
  });

  it('spots a new newest', () => {
    expect(recordFor('LAB001', collection)).toBe('newest');
  });

  it('says nothing about a plate between the ends', () => {
    expect(recordFor('HMN500', collection)).toBeNull();
  });

  it('does not depend on the order of the collection', () => {
    expect(recordFor('BCD001', [...collection].reverse())).toBe('oldest');
  });

  it('beats the end by a single plate, within a block', () => {
    expect(recordFor('GHK122', collection)).toBe('oldest');
    expect(recordFor('KXY790', collection)).toBe('newest');
  });

  describe('contradictory plates', () => {
    // V ahead of the activation: an early ordinal on a plate that cannot be old.
    const contradictory = 'AVA123';

    it('has the premise right', () => {
      expect(estimateIssuanceEra(contradictory).confidence).toBe('contradictory');
      expect(toOrdinal(contradictory)).toBeLessThan(toOrdinal('BCD001'));
    });

    it('never sets a record, even with the lowest ordinal', () => {
      expect(recordFor(contradictory, collection)).toBeNull();
    });

    it('is not the first plate either', () => {
      expect(recordFor(contradictory, [])).toBeNull();
    });

    it('is ignored when it already sits at the low end', () => {
      expect(recordFor('BCD001', [contradictory, ...collection])).toBe('oldest');
    });

    it('leaves a collection of nothing else empty', () => {
      expect(recordFor('GHK123', [contradictory])).toBe('first');
    });
  });

  it('lets a V or Z plate from after the activation be the newest', () => {
    expect(estimateIssuanceEra('LAZ500').confidence).not.toBe('contradictory');
    expect(recordFor('LAZ500', collection)).toBe('newest');
  });
});
