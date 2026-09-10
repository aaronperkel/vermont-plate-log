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

/*
 * Stamped metal: a lit top edge and a shadowed underside, both in the plate's
 * own greens rather than black and white, which is what keeps it from reading
 * as a drop shadow. Measured in em against the serial's own font size, so it
 * fades to nothing at row size instead of smearing.
 */
const EMBOSS = `0 0.022em 0.004em var(--plate-green-shadow), 0 -0.014em 0.004em var(--plate-green-light)`;

/** Placeholder strength, roughly where a browser holds one in an empty input. */
const PLACEHOLDER_OPACITY = 0.38;

const SLOTS = 6;

/*
 * One character of the serial.
 *
 * A typed character is stamped; a slot still waiting for one shows the
 * placeholder character instead, faint and flat, because a placeholder is not
 * stamped metal. Holding the waiting slots is the point: the serial is centred,
 * so a blank slot with no width would let every character shift sideways on
 * each keystroke instead of landing where it finally sits.
 */
function Slot({ char, typed }: { char: string; typed: boolean }) {
  return <span style={typed ? { textShadow: EMBOSS } : { opacity: PLACEHOLDER_OPACITY }}>{char}</span>;
}

type PlateProps = {
  /** Canonical unspaced form. May be partial while someone is typing. */
  plate: string;
  size?: PlateSize;
  /** Plays the stamp animation once. Used to confirm a save, nothing else. */
  stamped?: boolean;
  /**
   * Serial to fill the slots that have not been typed yet, the way a
   * placeholder sits in an empty input. Only the log field passes this.
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
  /*
   * Every slot is rendered, always. What has been typed comes from `plate`;
   * the rest comes from the placeholder, or is blank when there is none.
   */
  const waiting = (placeholder?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() ?? '').padEnd(SLOTS, ' ');
  const slots = Array.from({ length: SLOTS }, (_, i) => ({
    char: i < plate.length ? plate[i] : waiting[i],
    typed: i < plate.length,
  }));

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
          : plate.length === SLOTS
            ? `Vermont plate ${plate.slice(0, 3)} ${plate.slice(3)}`
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
        }}
      >
        {/*
          Per-character spans, because a typed character and a waiting one are
          styled differently. Letter-spacing applies after every character
          whatever the markup, so a complete plate lays out exactly as the plain
          string it used to be.
        */}
        {slots.slice(0, 3).map((slot, i) => (
          <Slot key={i} char={slot.char} typed={slot.typed} />
        ))}
        <span style={{ letterSpacing: `${R.serialTracking + 0.12}em` }}> </span>
        {slots.slice(3).map((slot, i) => (
          <Slot key={i + 3} char={slot.char} typed={slot.typed} />
        ))}
      </div>
    </div>
  );
}
