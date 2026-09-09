import { ALPHABET, ANCHORS, toOrdinal } from '@/lib/plate';

/*
 * The sequence line.
 *
 * One horizontal axis standing for Vermont's single sequential run, reused
 * across the app: under the live plate on the log screen, as the high-water
 * chart on stats, and as a thin rule on a plate's own page. It is the app's
 * recurring structural device, and it earns that by encoding the one thing the
 * whole app is about — position in a sequence.
 *
 * The domain stops just past the newest anchor rather than at ZZZ 999. Only
 * about 41% of the addressable space has ever been issued, so a full-range axis
 * would squash everything real into its left third.
 *
 * The anchors set that scale but are never drawn. They are a measurement of
 * where the sequence has reached, not plates anybody logged, and a mark on the
 * line is indistinguishable from a sighting — which reads as a collection that
 * already has something in it.
 */

const HEADROOM = 1.04;

function domainMax(): number {
  return Math.round(toOrdinal(`${ANCHORS[ANCHORS.length - 1].block}999`) * HEADROOM);
}

export type Mark = {
  ordinal: number;
  label?: string;
  kind: 'sighting' | 'current';
};

/** Ticks at each first-letter boundary that falls inside the domain. */
function letterTicks(max: number) {
  const ticks: Array<{ letter: string; percent: number }> = [];
  for (const letter of ALPHABET) {
    const ordinal = toOrdinal(`${letter}AA001`);
    if (ordinal > max) break;
    ticks.push({ letter, percent: (ordinal / max) * 100 });
  }
  return ticks;
}

export function SequenceLine({
  marks,
  showLetters = true,
  className = '',
}: {
  marks: Mark[];
  showLetters?: boolean;
  className?: string;
}) {
  const max = domainMax();
  const clamp = (n: number) => Math.min(100, Math.max(0, (n / max) * 100));

  return (
    <div className={className}>
      <div className="relative h-8">
        {/* The run itself. */}
        <div className="absolute inset-x-0 top-3 h-px bg-rule-strong" />

        {showLetters &&
          letterTicks(max).map((tick) => (
            <div
              key={tick.letter}
              className="absolute top-3 flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${tick.percent}%` }}
            >
              <div className="h-1.5 w-px bg-rule-strong" />
              <div className="mt-0.5 text-[10px] leading-none text-ink-faint">{tick.letter}</div>
            </div>
          ))}

        {marks.map((mark, i) => (
          <div
            key={`${mark.kind}-${mark.ordinal}-${i}`}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${clamp(mark.ordinal)}%` }}
            title={mark.label}
          >
            <div
              className={
                mark.kind === 'current'
                  ? 'mt-1.5 h-3 w-[3px] rounded-full bg-plate-green'
                  : 'mt-[9px] h-2 w-[2px] bg-plate-green/55'
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
