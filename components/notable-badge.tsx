import { CATEGORY_LABELS, type Notable, type NotableCategory } from '@/lib/notable';

/*
 * Outlined, never filled, and in deliberately desaturated hues. There is one
 * strong colour in this app and the plate has it; a row of filled badges would
 * pull attention straight off the thing they are annotating.
 *
 * Sentence case, not tracked-out caps.
 */
const TONES: Record<NotableCategory, string> = {
  airport: 'border-cat-airport/45 text-cat-airport',
  tech: 'border-cat-tech/45 text-cat-tech',
  slang: 'border-cat-slang/45 text-cat-slang',
  initials: 'border-cat-initials/45 text-cat-initials',
  other: 'border-cat-other/45 text-cat-other',
};

export function NotableBadge({ notable, showLabel = false }: { notable: Notable; showLabel?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span
        title={notable.label}
        className={`inline-flex items-center border px-1.5 py-px text-xs ${TONES[notable.category]}`}
      >
        {CATEGORY_LABELS[notable.category]}
      </span>
      {showLabel && <span className="text-xs text-ink-soft">{notable.label}</span>}
      {notable.theoretical && (
        <span
          title="Very likely blocked from sequential issuance, so it may never be stamped at all."
          className="inline-flex items-center border border-dashed border-rule-strong px-1.5 py-px text-xs text-ink-faint"
        >
          Theoretical
        </span>
      )}
    </span>
  );
}
