import { describe, expect, it } from 'vitest';

/*
 * The color book's coverage MATRIX, straight from `color-spaces.md` plus the
 * modification surface (the set the portfolio helper already tested:
 * `portfolio/tests/styles/colorWrap.helper.test.ts`).
 *
 * Comprehensive (every make-type, every output format, every modification), not
 * exhaustive (a representative color per cell). Each cell is a REAL failing
 * placeholder (red on purpose), never `it.todo`: implement the case, then replace
 * `pending()` with the real assertion (port the exact expectations from the
 * portfolio/deprecated tests where they already exist). A failing test names the
 * gap; a todo hides it.
 */
const pending = (): void => {
  expect(false).toBe(true); // pending: implement this matrix cell
};

/* ---------- axis 1: MAKE (every way to construct a real color) ---------- */
const MAKE = [
  'named string', // 'rebeccapurple'
  'hex string', // '#3366cc' / '#3366cc80'
  'rgb string',
  'rgb object', // { space:'rgb', ... }
  'hsl string',
  'hsl object',
  'hwb string',
  'hwb object',
  'lab string',
  'lab object',
  'lch string',
  'lch object',
  'oklab string',
  'oklab object',
  'oklch string',
  'oklch object',
  'transparent',
  're-wrap (existing color)',
];

/* ---------- axis 2: EMIT (every output format / colorFormats) ---------- */
const EMIT = [
  'css (modern rgb)',
  'rgbLegacy',
  'hex',
  'hexAlpha',
  'hsl',
  'hwb',
  'lab',
  'lch',
  'oklab',
  'oklch',
  'modern',
  'displayP3',
];

/* ---------- axis 3: MODIFY (every modification we support, + documented gaps) ---------- */
const MODIFY = [
  // supported today (portfolio helper)
  'alpha() get',
  'alpha(v) set',
  'darken(v?)',
  'lighten(v?)',
  'brighten(v?) (alias of lighten)',
  'saturate(v?)',
  'desaturate(v?)',
  'hueShift(deg)',
  'mix(target, ratio?, mode?)',
  'mixSolid(target, ratio?)',
  'mixWithAlpha(target, ratio, alpha?)',
  'blend.multiply(opts?)',
  'blend.screen(opts?)',
  'solid()',
  'clone()',
  'chaining (darken -> mix -> alpha)',
  // documented gaps (color-spaces.md) - not supported yet
  'setLightness',
  'setChroma',
  'setHue',
  'contrast',
  'ensureContrast',
  'complement (hue + 180)',
  'invert',
  'grayscale',
  'additional blend modes (overlay, ...)',
];

describe('color — make x emit matrix', () => {
  for (const make of MAKE) {
    describe(`make: ${make}`, () => {
      for (const emit of EMIT) {
        it(`emit: ${emit}`, pending);
      }
    });
  }
});

describe('color — modifications', () => {
  for (const mod of MODIFY) {
    it(`${mod}`, pending);
  }
});
