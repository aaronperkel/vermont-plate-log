import { PLATE_RATIOS as R } from '@/lib/plate-style';

/*
 * The plate. Used in list rows, as the face of the field on the log screen, and
 * full width on a detail page — the same markup every time.
 *
 * Scale comes from one custom property. `--plate-w` sets the width, the font
 * size is pinned to 1% of it, and every internal dimension is expressed in em.
 * So a row plate is genuinely the hero at a smaller size, not a second design
 * that happens to look similar, and the emboss thins out on its own as the
 * plate shrinks instead of turning into mud.
 */

export type PlateSize = 'row' | 'hero' | 'detail';

const WIDTHS: Record<PlateSize, string> = {
  row: '8.5rem',
  hero: 'min(80vw, 25rem)',
  detail: 'min(90vw, 33rem)',
};

type PlateProps = {
  /** Canonical unspaced form. May be partial while someone is typing. */
  plate: string;
  size?: PlateSize;
  /** Plays the stamp animation once. Used to confirm a save, nothing else. */
  stamped?: boolean;
  /**
   * Serial to show faintly while `plate` is empty, the way a placeholder sits
   * in an empty input. Only the log field passes this.
   */
  placeholder?: string;
  /**
   * Drop out of the accessibility tree. Set when the plate is the visible face
   * of a real input, which already carries the label and the value.
   */
  decorative?: boolean;
  className?: string;
};

export function Plate({
  plate,
  size = 'row',
  stamped = false,
  placeholder,
  decorative = false,
  className = '',
}: PlateProps) {
  /* Empty and given a placeholder: show that instead, at placeholder strength. */
  const ghost = plate.length === 0 && placeholder !== undefined;
  const serial = ghost ? placeholder.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : plate;
  const letters = serial.slice(0, 3).padEnd(3, ' ');
  const digits = serial.slice(3, 6).padEnd(3, ' ');

  return (
    <div
      className={`relative shrink-0 select-none ${stamped ? 'animate-stamp' : ''} ${className}`}
      style={{
        // 1em == 1% of the plate's width. Everything below is in em.
        ['--plate-w' as string]: WIDTHS[size],
        width: 'var(--plate-w)',
        fontSize: `calc(var(--plate-w) / 100)`,
        aspectRatio: `${R.aspect}`,
        background: 'var(--plate-green)',
        borderRadius: `${R.radius * 100}em`,
      }}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={
        decorative
          ? undefined
          : plate.trim().length === 6
            ? `Vermont plate ${letters} ${digits}`
            : 'Vermont plate'
      }
    >
      {/* The thin keyline, inset from the edge the way the stamping die leaves it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          inset: `${R.keylineInset * 100}em`,
          border: `${R.keylineWidth * 100}em solid var(--plate-white)`,
          borderRadius: `${R.keylineRadius * 100}em`,
          opacity: 0.9,
        }}
      />

      <div
        aria-hidden
        className="absolute inset-x-0 text-center"
        style={{
          top: `${R.legendTop * 100}%`,
          color: 'var(--plate-white)',
          fontFamily: 'var(--font-plate)',
          fontSize: `${R.legendSize * 100}em`,
          letterSpacing: `${R.legendTracking}em`,
          // Tracking adds space after the last letter; nudge back to stay centred.
          textIndent: `${R.legendTracking}em`,
          lineHeight: 1,
          fontWeight: 600,
        }}
      >
        Vermont
      </div>

      <div
        aria-hidden
        className="absolute inset-x-0 text-center"
        style={{
          top: `${R.serialCentre * 100}%`,
          transform: 'translateY(-50%)',
          color: 'var(--plate-white)',
          fontFamily: 'var(--font-plate)',
          fontSize: `${R.serialSize * 100}em`,
          letterSpacing: `${R.serialTracking}em`,
          textIndent: `${R.serialTracking}em`,
          lineHeight: 1,
          fontWeight: 600,
          /*
           * Stamped metal: a lit top edge and a shadowed underside, both in the
           * plate's own greens rather than black and white, which is what keeps
           * it from reading as a drop shadow. Measured in em, so it fades to
           * nothing at row size instead of smearing.
           */
          textShadow: ghost
            ? 'none'
            : `0 0.022em 0.004em var(--plate-green-shadow), 0 -0.014em 0.004em var(--plate-green-light)`,
          /* A placeholder is not stamped metal, so it loses the emboss as well as the weight. */
          opacity: ghost ? 0.38 : 1,
        }}
      >
        {letters}
        <span style={{ letterSpacing: `${R.serialTracking + 0.12}em` }}> </span>
        {digits}
      </div>
    </div>
  );
}
