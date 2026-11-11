import { estimateIssuanceEra, toOrdinal } from '@/lib/plate';

/*
 * Whether a plate just logged extends the collection at either end.
 *
 * Decided on the server, after the insert, because two phones log into the same
 * collection and only the database knows where its ends are. The log form reads
 * the answer off the save response and throws confetti for anything but null.
 *
 * A contradictory plate never counts, in either role. One with V or Z ahead of
 * the activation computes to an early ordinal without being an old plate, so it
 * cannot become the oldest, and it is left out when working out where the ends
 * currently are — otherwise one such plate would sit at the bottom of the
 * collection forever and no genuinely old plate could ever beat it. A V or Z
 * plate from after the activation is an ordinary plate and counts like any other.
 */
export type SightingRecord = 'oldest' | 'newest' | 'first' | null;

function counts(plate: string): boolean {
  return estimateIssuanceEra(plate).confidence !== 'contradictory';
}

/** `others` is every other plate in the collection, in any order. */
export function recordFor(plate: string, others: readonly string[]): SightingRecord {
  if (!counts(plate)) return null;

  const ordinals = others.filter(counts).map(toOrdinal);
  if (ordinals.length === 0) return 'first';

  const ordinal = toOrdinal(plate);
  if (ordinal < Math.min(...ordinals)) return 'oldest';
  if (ordinal > Math.max(...ordinals)) return 'newest';
  return null;
}
