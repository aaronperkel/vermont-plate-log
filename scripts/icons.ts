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

const PUBLIC = join(process.cwd(), 'public');
/*
 * The tab icon is the one that cannot live in public/. Next puts an icon it
 * discovers in app/ ahead of anything metadata.icons declares, so a file here
 * is the only way to win the tab — which is precisely how the scaffolded
 * favicon.ico held it while the plate artwork sat behind it in the metadata.
 */
const APP = join(process.cwd(), 'app');

/*
 * maskRadius is the corner the platform will cut, as a fraction of the side.
 * Where it is set, the keyline is rounded concentrically with that cut instead
 * of to the plate's own radius — see tile().
 */
const SIZES = [
  { file: 'icon-192.png', dir: PUBLIC, size: 192, safeArea: 1, maskRadius: 0 },
  { file: 'icon-512.png', dir: PUBLIC, size: 512, safeArea: 1, maskRadius: 0 },
  /*
   * iOS masks the home-screen icon to its superellipse whatever the artwork
   * says: on 180px that is a 40px corner, against a keyline sitting 10px in
   * with a 7px radius. The keyline cleared the mask by 0.4px at the corners
   * and by 10px along the flats, so it read as a frame with its corners
   * sheared off. 0.2237 is the ratio Apple has used since iOS 7.
   */
  { file: 'apple-touch-icon.png', dir: PUBLIC, size: 180, safeArea: 1, maskRadius: 0.2237 },
  /*
   * Android crops maskable icons to its own shape, anywhere from a circle to a
   * squircle, and only the middle 80% is guaranteed to survive. The artwork is
   * scaled down to sit inside that, which is what keeps the keyline clear here.
   */
  { file: 'icon-maskable-512.png', dir: PUBLIC, size: 512, safeArea: 0.78, maskRadius: 0 },
  /*
   * The browser tab, rendered at the size it is actually shown rather than
   * scaled down from a large one — a downscaled keyline lands between pixels
   * and greys out. At this size the keyline hits the 2px floor in tile() and
   * so reads heavier than it does on the home screen, which is the trade for
   * it being visible at all.
   *
   * A png, not an .ico: sharp cannot write that container. Browsers have read
   * png icons for a decade and take this one from the link tag, but nothing
   * answers a bare /favicon.ico any more — a scraper that guesses that path
   * rather than reading the tag gets a 404.
   */
  { file: 'icon.png', dir: APP, size: 32, safeArea: 1, maskRadius: 0 },
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

  for (const { file, dir, size, safeArea, maskRadius } of SIZES) {
    await mkdir(dir, { recursive: true });
    const svg = await satori(tile(size, safeArea, maskRadius) as never, {
      width: size,
      height: size,
      fonts: [{ name: 'Barlow', data: font, weight: 600, style: 'normal' }],
    });

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    await writeFile(join(dir, file), png);
    console.log(`${file}  ${size}x${size}`);
  }
}

main().catch((error: unknown) => {
  console.error('Icon generation failed:', error);
  process.exit(1);
});
