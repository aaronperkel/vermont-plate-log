import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { OG_PLATE_WIDTH, PLATE_COLORS, PLATE_RATIOS as R } from '@/lib/plate-style';
import { estimateIssuanceEra, format, parse, toOrdinal, validate } from '@/lib/plate';
import { findByPlate } from '@/lib/queries/sightings';

/*
 * The share card.
 *
 * This is a second implementation of the plate, not a reuse of <Plate>.
 * ImageResponse renders through satori, which supports neither Tailwind nor CSS
 * custom properties, so the markup has to be inline styles. The numbers and
 * colours both versions use come from lib/plate-style.ts, and a test asserts
 * those still match the tokens in globals.css — that shared source is the only
 * thing keeping the two from drifting.
 *
 * No `export const runtime` on purpose: the default gives Node, which is what
 * makes the font reads below work.
 */

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'A Vermont licence plate';

const SPOTTERS: Record<string, string> = { aaron: 'Aaron', riley: 'Riley' };

/** Satori cannot read woff2, so these are the committed TrueType copies. */
function font(file: string) {
  return readFile(join(process.cwd(), 'assets', 'fonts', file));
}

export default async function Image({ params }: { params: Promise<{ plate: string }> }) {
  const raw = decodeURIComponent((await params).plate);
  const plate = parse(raw);

  const [plateFont, uiRegular, uiSemi] = await Promise.all([
    font('BarlowSemiCondensed-SemiBold.ttf'),
    font('PublicSans-Regular.ttf'),
    font('PublicSans-SemiBold.ttf'),
  ]);

  const fonts = [
    { name: 'Barlow', data: plateFont, weight: 600 as const, style: 'normal' as const },
    { name: 'Public Sans', data: uiRegular, weight: 400 as const, style: 'normal' as const },
    { name: 'Public Sans', data: uiSemi, weight: 600 as const, style: 'normal' as const },
  ];

  if (!plate || !validate(plate).ok) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f7f7',
            color: '#5c6668',
            fontFamily: 'Public Sans',
            fontSize: 40,
          }}
        >
          Not a Vermont plate
        </div>
      ),
      { ...size, fonts },
    );
  }

  const sighting = await findByPlate(plate);
  const era = estimateIssuanceEra(plate);
  const w = OG_PLATE_WIDTH;
  const h = w / R.aspect;

  const caption = sighting
    ? `Spotted by ${SPOTTERS[sighting.spottedBy]}${sighting.location ? ` at ${sighting.location}` : ''}`
    : 'Not spotted yet';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f7f7',
          fontFamily: 'Public Sans',
        }}
      >
        {/* The plate, same proportions as the component. */}
        <div
          style={{
            display: 'flex',
            position: 'relative',
            width: w,
            height: h,
            background: PLATE_COLORS.green,
            borderRadius: w * R.radius,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: w * R.keylineInset,
              left: w * R.keylineInset,
              right: w * R.keylineInset,
              bottom: w * R.keylineInset,
              border: `${w * R.keylineWidth}px solid ${PLATE_COLORS.white}`,
              borderRadius: w * R.keylineRadius,
              opacity: 0.9,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: h * R.legendTop,
              left: 0,
              width: w,
              display: 'flex',
              justifyContent: 'center',
              color: PLATE_COLORS.white,
              fontFamily: 'Barlow',
              fontSize: w * R.legendSize,
              letterSpacing: w * R.legendSize * R.legendTracking,
              lineHeight: 1,
            }}
          >
            Vermont
          </div>
          <div
            style={{
              position: 'absolute',
              top: h * R.serialCentre - (w * R.serialSize) / 2,
              left: 0,
              width: w,
              display: 'flex',
              justifyContent: 'center',
              color: PLATE_COLORS.white,
              fontFamily: 'Barlow',
              fontSize: w * R.serialSize,
              letterSpacing: w * R.serialSize * R.serialTracking,
              lineHeight: 1,
              textShadow: `0 ${w * R.serialSize * 0.022}px 0 ${PLATE_COLORS.greenShadow}`,
            }}
          >
            {format(plate)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 46, alignItems: 'baseline' }}>
          <div style={{ fontSize: 30, fontWeight: 600, color: '#16191a' }}>{caption}</div>
        </div>
        <div style={{ display: 'flex', marginTop: 10, fontSize: 24, color: '#5c6668' }}>
          {`Number ${toOrdinal(plate).toLocaleString()} in the sequence, issued ${era.label}`}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
