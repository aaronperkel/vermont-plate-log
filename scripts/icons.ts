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

const SIZES = [
  { file: 'icon-192.png', size: 192, safeArea: 1 },
  { file: 'icon-512.png', size: 512, safeArea: 1 },
  { file: 'apple-touch-icon.png', size: 180, safeArea: 1 },
  /*
   * Android crops maskable icons to its own shape, anywhere from a circle to a
   * squircle, and only the middle 80% is guaranteed to survive. The artwork is
   * scaled down to sit inside that.
   */
  { file: 'icon-maskable-512.png', size: 512, safeArea: 0.78 },
];

function tile(size: number, safeArea: number) {
  const art = size * safeArea;
  const inset = (size - art) / 2;

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
            top: inset + art * R.keylineInset * 2,
            left: inset + art * R.keylineInset * 2,
            right: inset + art * R.keylineInset * 2,
            bottom: inset + art * R.keylineInset * 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `${Math.max(2, art * R.keylineWidth * 1.8)}px solid ${PLATE_COLORS.white}`,
            borderRadius: art * R.keylineRadius * 2,
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

  for (const { file, size, safeArea } of SIZES) {
    const svg = await satori(tile(size, safeArea) as never, {
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
