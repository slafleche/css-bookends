import { converter, formatCss, parse } from 'culori';
import { describe, expect, it } from 'vitest';

import {
  colorFormats,
  type ColorInput,
  type ColorObject,
  type ColorSpace,
  type CssFormat,
  parseColor,
  publishBookColor,
  storeColor,
} from '../../src/color';

/*
 * The color book's coverage MATRIX (from color-spaces.md + the modification surface).
 *
 * EMIT axis (make x emit): REAL assertions. Each cell builds a color from a make-form
 * and renders it in an emit format, then round-trips the output back to sRGB and
 * checks it represents the same color (within tolerance). Every make is the same
 * in-gamut, opaque color expressed in each space (named uses rebeccapurple), so no
 * gamut/alpha violations fire here - those are covered in color.output.src.test.ts.
 *
 * MODIFY axis: still real failing placeholders (gap markers, never `it.todo`) - the
 * modification algebra is the next step.
 */

const color = publishBookColor();
const toRgb = converter('rgb');

/* ---------- axis 1: MAKE (the same in-gamut color in every space) ---------- */
const REF = parse('#3366cc');
if (REF === undefined) throw new Error('ref color failed to parse');
const inSpace = (space: ColorSpace): Record<string, number> =>
  converter(space)(REF) as unknown as Record<string, number>;

const objOf = (space: ColorSpace): ColorObject => {
  const c = inSpace(space);
  switch (space) {
    case 'rgb':
      return { space, r: c.r * 255, g: c.g * 255, b: c.b * 255 };
    case 'hsl':
      return { space, h: c.h ?? 0, s: c.s * 100, l: c.l * 100 };
    case 'hwb':
      return { space, h: c.h ?? 0, w: c.w * 100, b: c.b * 100 };
    case 'lab':
      return { space, l: c.l, a: c.a, b: c.b };
    case 'lch':
      return { space, l: c.l, c: c.c, h: c.h ?? 0 };
    case 'oklab':
      return { space, l: c.l, a: c.a, b: c.b };
    case 'oklch':
      return { space, l: c.l, c: c.c, h: c.h ?? 0 };
  }
};
const strOf = (space: ColorSpace): string =>
  formatCss(converter(space)(REF));

const MAKE: Array<
  [
    string,
    ColorInput,
  ]
> = [
  [
    'named string',
    'rebeccapurple',
  ],
  [
    'hex string',
    '#3366cc',
  ],
  [
    'rgb string',
    strOf('rgb'),
  ],
  [
    'rgb object',
    objOf('rgb'),
  ],
  [
    'hsl string',
    strOf('hsl'),
  ],
  [
    'hsl object',
    objOf('hsl'),
  ],
  [
    'hwb string',
    strOf('hwb'),
  ],
  [
    'hwb object',
    objOf('hwb'),
  ],
  [
    'lab string',
    strOf('lab'),
  ],
  [
    'lab object',
    objOf('lab'),
  ],
  [
    'lch string',
    strOf('lch'),
  ],
  [
    'lch object',
    objOf('lch'),
  ],
  [
    'oklab string',
    strOf('oklab'),
  ],
  [
    'oklab object',
    objOf('oklab'),
  ],
  [
    'oklch string',
    strOf('oklch'),
  ],
  [
    'oklch object',
    objOf('oklch'),
  ],
];

/* ---------- axis 2: EMIT (every output format / colorFormats) ---------- */
const EMIT: Array<
  [
    string,
    CssFormat,
  ]
> = [
  [
    'rgba',
    colorFormats.rgba,
  ],
  [
    'rgb',
    colorFormats.rgb,
  ],
  [
    'hex',
    colorFormats.hex,
  ],
  [
    'hexAlpha',
    colorFormats.hexAlpha,
  ],
  [
    'hsl',
    colorFormats.hsl,
  ],
  [
    'hwb',
    colorFormats.hwb,
  ],
  [
    'lab',
    colorFormats.lab,
  ],
  [
    'lch',
    colorFormats.lch,
  ],
  [
    'oklab',
    colorFormats.oklab,
  ],
  [
    'oklch',
    colorFormats.oklch,
  ],
  [
    'displayP3',
    colorFormats.displayP3,
  ],
];

const refRgb = (input: ColorInput): Record<string, number> => {
  const stored = storeColor(parseColor(input));
  if (stored.kind !== 'color') throw new Error('expected a color');
  return toRgb(stored.color) as unknown as Record<string, number>;
};
const parseRgb = (css: string): Record<string, number> => {
  const parsed = parse(css);
  if (parsed === undefined)
    throw new Error(`unparseable output: ${css}`);
  return toRgb(parsed) as unknown as Record<string, number>;
};

describe('color — make x emit matrix', () => {
  for (const [
    makeLabel,
    input,
  ] of MAKE) {
    describe(`make: ${makeLabel}`, () => {
      const ref = refRgb(input);
      for (const [
        emitLabel,
        format,
      ] of EMIT) {
        it(`emit: ${emitLabel}`, () => {
          const css = color(input).css(format);
          const got = parseRgb(css);
          expect(got.r).toBeCloseTo(ref.r, 2);
          expect(got.g).toBeCloseTo(ref.g, 2);
          expect(got.b).toBeCloseTo(ref.b, 2);
        });
      }
    });
  }
});

/* The spec's "plus an alpha case": a translucent color round-trips its alpha through
 * every alpha-capable format. (rgb/hex drop alpha; that path is covered by the
 * violation tests in color.output.src.test.ts.) */
const ALPHA_EMIT = EMIT.filter(
  ([
    emitLabel,
  ]) => emitLabel !== 'rgb' && emitLabel !== 'hex',
);

describe('color — alpha round-trips through alpha-capable formats', () => {
  const translucent = '#3366cc80'; // alpha ~0.502
  const ref = refRgb(translucent);
  for (const [
    emitLabel,
    format,
  ] of ALPHA_EMIT) {
    it(`emit: ${emitLabel} preserves color + alpha`, () => {
      const got = parseRgb(color(translucent).css(format));
      expect(got.r).toBeCloseTo(ref.r, 2);
      expect(got.g).toBeCloseTo(ref.g, 2);
      expect(got.b).toBeCloseTo(ref.b, 2);
      expect(got.alpha ?? 1).toBeCloseTo(0.5, 2);
    });
  }
});

/* ---------- axis 3: MODIFY ---------- */
// The core algebra (alpha/darken/lighten/brighten/saturate/desaturate/hueShift/mix/
// mixSolid/mixWithAlpha/solid/clone/chaining) is implemented and tested in
// color.modify.src.test.ts. The cells below are the still-deferred gaps: `blend`
// (its old semantics were a non-standard alpha hack - needs a real design) and the
// documented gaps from color-spaces.md. Real failing placeholders (never `it.todo`).
const pending = (): void => {
  expect(false).toBe(true); // pending: not implemented yet
};
const MODIFY_GAPS = [
  'blend.multiply(opts?)',
  'blend.screen(opts?)',
  'additional blend modes (overlay, ...)',
  'setLightness',
  'setChroma',
  'setHue',
  'contrast',
  'ensureContrast',
  'complement (hue + 180)',
  'invert',
  'grayscale',
];

describe('color — modification gaps (DEFERRED, failing on purpose)', () => {
  for (const mod of MODIFY_GAPS) {
    it(`${mod}`, pending);
  }
});
