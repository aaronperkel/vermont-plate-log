/*
 * The plate's visual constants, in one place.
 *
 * <Plate> renders with Tailwind and CSS custom properties; the Open Graph route
 * renders the same object with inline styles, because ImageResponse/satori
 * supports neither. That is two implementations of one design, so the numbers
 * they share live here rather than in either of them.
 *
 * A test asserts these hex values match the tokens in app/globals.css, which is
 * the only thing stopping the two from drifting apart silently.
 */

export const PLATE_COLORS = {
  green: '#14664a',
  greenShadow: '#0b4531',
  greenLight: '#1b7a59',
  white: '#f6f8f7',
} as const;

/*
 * Every internal dimension as a fraction of the plate's width, so one width
 * drives the whole object and a row-size plate is the hero at a different
 * scale rather than a different design.
 *
 * Real Vermont plates are 12in by 6in, hence the 2:1.
 */
export const PLATE_RATIOS = {
  aspect: 2,

  /*
   * ---- Fractions of the plate's WIDTH ----
   *
   * The component pins 1em to 1% of the width, so these are written in em
   * there and multiplied by the width in the Open Graph route.
   */
  radius: 0.034,
  keylineInset: 0.028,
  keylineWidth: 0.0105,
  keylineRadius: 0.019,
  legendSize: 0.069,
  legendTracking: 0.19,
  /*
   * At this size the seven glyphs plus tracking come to roughly 3.8x the font
   * size, which fits inside the keyline with a little air either side. Larger
   * pushes the digits into the border.
   */
  serialSize: 0.212,
  serialTracking: 0.052,

  /*
   * ---- Fractions of the plate's HEIGHT ----
   *
   * These are vertical offsets and must NOT be written in em. An em resolves
   * against the element's own font-size, and both of these sit on elements that
   * override it — so `top: 29em` on the serial resolved against the serial's
   * own 21.2em and put it six plate-widths below the plate. They are CSS
   * percentages instead, which resolve against the containing block.
   */
  legendTop: 0.115,
  /** Optical centre of the serial: just below the middle, as on a real plate. */
  serialCentre: 0.6,
} as const;

/** Width in CSS pixels used by the Open Graph card. */
export const OG_PLATE_WIDTH = 880;
