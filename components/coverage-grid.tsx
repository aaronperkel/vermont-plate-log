import { ALPHABET, BLOCK_SIZE, toOrdinal } from '@/lib/plate';

/*
 * Collection coverage as a 22 by 22 grid of two-letter prefixes: first letter
 * down the side, second across the top.
 *
 * Two letters, not three. A three-letter grid would be 10,648 cells and would
 * grow unboundedly with the span between your oldest and newest plate; this one
 * is always 484 cells whatever gets logged, and a prefix block is a meaningful
 * unit — about 22,000 plates, which is a hundred days of issuing.
 *
 * One hue at two strengths rather than a colour scale. A cell is either inside
 * the run you have covered or outside it, and that is the whole message.
 */

export const PREFIX_SIZE = ALPHABET.length * BLOCK_SIZE;

export function prefixRange(prefix: string): [number, number] {
  return [toOrdinal(`${prefix}${ALPHABET[0]}001`), toOrdinal(`${prefix}${ALPHABET[ALPHABET.length - 1]}999`)];
}

export function allPrefixes(): string[] {
  const out: string[] = [];
  for (const first of ALPHABET) for (const second of ALPHABET) out.push(`${first}${second}`);
  return out;
}

export function CoverageGrid({
  counts,
  span,
}: {
  counts: Map<string, number>;
  /** Lowest and highest ordinal logged, or null when there is nothing to span. */
  span: [number, number] | null;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="mx-auto border-separate border-spacing-[2px] text-[9px] leading-none sm:text-[10px]">
        <caption className="sr-only">
          Coverage of two-letter plate prefixes. Filled cells are prefixes you have logged.
        </caption>
        <thead>
          <tr>
            <th className="w-3 sm:w-4" />
            {[...ALPHABET].map((second) => (
              <th key={second} scope="col" className="w-3 pb-1 font-normal text-ink-faint sm:w-4">
                {second}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...ALPHABET].map((first) => (
            <tr key={first}>
              <th scope="row" className="pr-1 text-right font-normal text-ink-faint">
                {first}
              </th>
              {[...ALPHABET].map((second) => {
                const prefix = `${first}${second}`;
                const count = counts.get(prefix) ?? 0;
                const [low, high] = prefixRange(prefix);
                const inSpan = span !== null && high >= span[0] && low <= span[1];

                const style = count
                  ? 'bg-plate-green border-plate-green'
                  : inSpan
                    ? 'border-plate-green/40'
                    : 'border-rule/60';

                return (
                  <td key={prefix} className="p-0">
                    <div
                      className={`h-3 w-3 border sm:h-4 sm:w-4 ${style}`}
                      title={
                        count
                          ? `${prefix} — ${count} logged`
                          : inSpan
                            ? `${prefix} — inside your run, nothing logged`
                            : `${prefix} — outside your run`
                      }
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type Run = { from: string; to: string; blocks: number };

/** Consecutive unseen prefixes inside the covered span, as runs. */
export function unseenRuns(counts: Map<string, number>, span: [number, number] | null): Run[] {
  if (!span) return [];

  const runs: Run[] = [];
  let open: Run | null = null;

  for (const prefix of allPrefixes()) {
    const [low, high] = prefixRange(prefix);
    const inSpan = high >= span[0] && low <= span[1];
    const seen = (counts.get(prefix) ?? 0) > 0;

    if (inSpan && !seen) {
      open =
        open === null
          ? { from: prefix, to: prefix, blocks: 1 }
          : { from: open.from, to: prefix, blocks: open.blocks + 1 };
    } else if (open) {
      runs.push(open);
      open = null;
    }
  }
  if (open) runs.push(open);

  return runs.sort((a, b) => b.blocks - a.blocks);
}
