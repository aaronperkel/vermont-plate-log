import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { PLATE_COLORS, PLATE_RATIOS as R } from '../lib/plate-style';

/*
 * Home-screen icons, generated rather than hand-drawn.
 *
 * The artwork is the plate itself: the green tile, the inset keyline, white
 * letters. Generating it from the same constants the app uses means the icon
 * cannot drift away from the thing it depicts, and re-running this after a
 * colour change is one command rather than a round trip through a drawing tool.
 *
 * satori lays out the tile and converts the text to paths using the committed
 * TrueType face; sharp rasterises the result. Nothing here needs a browser.
 */

const OUT = join(process.cwd(), 'public');

/*
 * maskRadius is the corner the platform will cut, as a fraction of the side.
 * Where it is set, the keyline is rounded concentrically with that cut instead
 * of to the plate's own radius — see tile().
 */
const SIZES = [
  { file: 'icon-192.png', size: 192, safeArea: 1, maskRadius: 0 },
  { file: 'icon-512.png', size: 512, safeArea: 1, maskRadius: 0 },
  /*
   * iOS masks the home-screen icon to its superellipse whatever the artwork
   * says: on 180px that is a 40px corner, against a keyline sitting 10px in
   * with a 7px radius. The keyline cleared the mask by 0.4px at the corners
   * and by 10px along the flats, so it read as a frame with its corners
   * sheared off. 0.2237 is the ratio Apple has used since iOS 7.
   */
  { file: 'apple-touch-icon.png', size: 180, safeArea: 1, maskRadius: 0.2237 },
  /*
   * Android crops maskable icons to its own shape, anywhere from a circle to a
   * squircle, and only the middle 80% is guaranteed to survive. The artwork is
   * scaled down to sit inside that, which is what keeps the keyline clear here.
   */
  { file: 'icon-maskable-512.png', size: 512, safeArea: 0.78, maskRadius: 0 },
];

function tile(size: number, safeArea: number, maskRadius: number) {
  const art = size * safeArea;
  const inset = (size - art) / 2;
  const keyline = inset + art * R.keylineInset * 2;

  /*
   * Concentric with the mask, so the keyline stays the same distance from the
   * visible edge the whole way round. Without it the corners are the only place
   * the frame runs out of room.
   */
  const radius = maskRadius > 0
    ? Math.max(0, size * maskRadius - keyline)
    : art * R.keylineRadius * 2;

  return {
    type: 'div',
    props: {
      style: {
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: PLATE_COLORS.green,
      },
      children: {
        type: 'div',
        props: {
          style: {
            position: 'absolute',
            top: keyline,
            left: keyline,
            right: keyline,
            bottom: keyline,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `${Math.max(2, art * R.keylineWidth * 1.8)}px solid ${PLATE_COLORS.white}`,
            borderRadius: radius,
            color: PLATE_COLORS.white,
            fontFamily: 'Barlow',
            /* Two characters, so it can be far larger than a full serial. */
            fontSize: art * 0.46,
            letterSpacing: art * 0.46 * R.serialTracking,
            lineHeight: 1,
          },
          children: 'VT',
        },
      },
    },
  };
}

async function main() {
  const font = await readFile(join(process.cwd(), 'assets', 'fonts', 'BarlowSemiCondensed-SemiBold.ttf'));
  await mkdir(OUT, { recursive: true });

  for (const { file, size, safeArea, maskRadius } of SIZES) {
    const svg = await satori(tile(size, safeArea, maskRadius) as never, {
      width: size,
      height: size,
      fonts: [{ name: 'Barlow', data: font, weight: 600, style: 'normal' }],
    });

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    await writeFile(join(OUT, file), png);
    console.log(`${file}  ${size}x${size}`);
  }
}

main().catch((error: unknown) => {
  console.error('Icon generation failed:', error);
  process.exit(1);
});
