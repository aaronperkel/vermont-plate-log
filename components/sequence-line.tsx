import { ALPHABET, ANCHORS, BLOCK_SIZE, describeMonth, toOrdinal } from '@/lib/plate';

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
 */

const HEADROOM = 1.04;

function domainMax(): number {
  return Math.round(toOrdinal(`${ANCHORS[ANCHORS.length - 1].block}999`) * HEADROOM);
}

export type Mark = {
  ordinal: number;
  label?: string;
  kind: 'anchor' | 'sighting' | 'current';
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
  anchorKey = false,
  className = '',
}: {
  marks: Mark[];
  showLetters?: boolean;
  /** Names the anchors underneath, in prose. Off where space is tight. */
  anchorKey?: boolean;
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

        {marks.map((mark, i) => {
          const percent = clamp(mark.ordinal);
          const isCurrent = mark.kind === 'current';
          const isAnchor = mark.kind === 'anchor';

          return (
            <div
              key={`${mark.kind}-${mark.ordinal}-${i}`}
              className="absolute top-0 -translate-x-1/2"
              style={{ left: `${percent}%` }}
              title={mark.label}
            >
              {isAnchor ? (
                <div className="flex flex-col items-center">
                  <div className="h-3 w-px bg-ink-faint" />
                  <div className="h-3 w-px bg-ink-faint" />
                </div>
              ) : (
                <div
                  className={
                    isCurrent
                      ? 'mt-1.5 h-3 w-[3px] rounded-full bg-plate-green'
                      : 'mt-[9px] h-2 w-[2px] bg-plate-green/55'
                  }
                />
              )}
            </div>
          );
        })}
      </div>

      {/*
        Anchor names go in a sentence rather than as labels on the line. Both
        anchors sit in the last tenth of the domain, so positioned labels
        overlap each other at any width a phone can offer.
      */}
      {anchorKey && (
        <p className="mt-2 text-xs text-ink-faint">
          Confirmed sightings:{' '}
          {ANCHORS.map((a, i) => (
            <span key={a.block}>
              {i > 0 ? ' and ' : ''}
              {a.block} in {describeMonth(a.observed)}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

/** The two sequence anchors, as marks. Every view that draws the line shows these. */
export function anchorMarks(): Mark[] {
  return ANCHORS.map((anchor) => ({
    ordinal: toOrdinal(`${anchor.block}${String(Math.floor(BLOCK_SIZE / 2)).padStart(3, '0')}`),
    label: `${anchor.block}, confirmed ${describeMonth(anchor.observed)}`,
    kind: 'anchor' as const,
  }));
}
