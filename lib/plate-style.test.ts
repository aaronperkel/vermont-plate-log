import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PLATE_COLORS } from './plate-style';

/*
 * The plate exists twice — once as a React component styled with CSS custom
 * properties, once as inline styles inside ImageResponse, which cannot use
 * them. Nothing at runtime connects the two, so this checks they still agree.
 */
describe('plate colours', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

  it.each([
    ['--plate-green', PLATE_COLORS.green],
    ['--plate-green-shadow', PLATE_COLORS.greenShadow],
    ['--plate-green-light', PLATE_COLORS.greenLight],
    ['--plate-white', PLATE_COLORS.white],
  ])('%s in globals.css matches plate-style.ts', (token, expected) => {
    const match = css.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`));
    expect(match, `${token} not found in globals.css`).not.toBeNull();
    expect(match![1].toLowerCase()).toBe(expected.toLowerCase());
  });
});
