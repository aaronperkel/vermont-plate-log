import { ALPHABET, BLOCK_SIZE, LEGACY_ALPHABET, blocksInPrefix, toOrdinal } from '@/lib/plate';

/*
 * Collection coverage as a 21 by 21 grid of two-letter prefixes: first letter
 * down the side, second across the top.
 *
 * Two letters, not three. A three-letter grid would be 9,261 cells and would
 * grow unboundedly with the span between your oldest and newest plate; this one
 * is always 441 cells whatever gets logged, and a prefix block is a meaningful
 * unit — about 20,000 plates, which is a hundred days of issuing.
 *
 * Not every cell is a prefix Vermont issued. Before late 2023 the sequence ran
 * through 19 letters, so the earlier prefixes containing V or Z were stepped
 * over and are shaded grey rather than counted as gaps — see blocksInPrefix.
 * The same is why a prefix is 19,000 plates on one side of the activation and
 * 21,000 on the other.
 *
 * One hue at two strengths rather than a colour scale. A cell is either inside
 * the run you have covered or outside it, and that is the whole message.
 */

/** Plates under a prefix on each side of the activation. */
export const LEGACY_PREFIX_SIZE = LEGACY_ALPHABET.length * BLOCK_SIZE;
export const PREFIX_SIZE = ALPHABET.length * BLOCK_SIZE;

/** Plates Vermont actually issued under a prefix; zero for one it skipped. */
export function platesInPrefix(prefix: string): number {
  return blocksInPrefix(prefix) * BLOCK_SIZE;
}

export function prefixRange(prefix: string): [number, number] {
  return [toOrdinal(`${prefix}${ALPHABET[0]}000`), toOrdinal(`${prefix}${ALPHABET[ALPHABET.length - 1]}999`)];
}

/** Every cell in the grid, issued or not. */
export function allPrefixes(): string[] {
  const out: string[] = [];
  for (const first of ALPHABET) for (const second of ALPHABET) out.push(`${first}${second}`);
  return out;
}

/** The prefixes Vermont has issued or will issue, in sequence order. */
export function issuedPrefixes(): string[] {
  return allPrefixes().filter((prefix) => blocksInPrefix(prefix) > 0);
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
                const issued = blocksInPrefix(prefix) > 0;
                const [low, high] = prefixRange(prefix);
                const inSpan = span !== null && high >= span[0] && low <= span[1];

                const style = count
                  ? 'bg-plate-green border-plate-green'
                  : !issued
                    ? 'bg-rule-strong border-rule-strong'
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
                          : !issued
                            ? `${prefix} — doesn't exist, the sequence passed it before V and Z were in use`
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

export type Run = { from: string; to: string; blocks: number; plates: number };

/*
 * Consecutive unseen prefixes inside the covered span, as runs, largest first.
 *
 * Walks issued prefixes only. A skipped prefix is not a gap, and it does not
 * break one either: AT and AW are neighbours in the sequence that was actually
 * stamped, so an empty AT and an empty AW are one run of two.
 */
export function unseenRuns(counts: Map<string, number>, span: [number, number] | null): Run[] {
  if (!span) return [];

  const runs: Run[] = [];
  let open: Run | null = null;

  for (const prefix of issuedPrefixes()) {
    const [low, high] = prefixRange(prefix);
    const inSpan = high >= span[0] && low <= span[1];
    const seen = (counts.get(prefix) ?? 0) > 0;
    const plates = platesInPrefix(prefix);

    if (inSpan && !seen) {
      open =
        open === null
          ? { from: prefix, to: prefix, blocks: 1, plates }
          : { from: open.from, to: prefix, blocks: open.blocks + 1, plates: open.plates + plates };
    } else if (open) {
      runs.push(open);
      open = null;
    }
  }
  if (open) runs.push(open);

  return runs.sort((a, b) => b.plates - a.plates);
}
