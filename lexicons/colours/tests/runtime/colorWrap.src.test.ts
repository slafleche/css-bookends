import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import {
  color,
  colorFallback,
  colorModern,
  fmtOKLCH,
  mixWithAlpha,
  oklchToRgbString,
  toModernOKLCH,
} from '../../src/colorWrap';

describe('colorWrap.helper', () => {
  it('wraps colors immutably and exposes css/alpha helpers', () => {
    const base = color('#ff0000');
    const tinted = base.alpha(0.5);

    expect(base.css()).toBe('rgb(255 0 0)');
    expect(tinted.css()).toBe('rgb(255 0 0 / 0.5)');
    expect(base.alpha()).toBe(1);
    expect(tinted.alpha()).toBeCloseTo(0.5);
  });

  it('supports mixing while preserving alpha via mixWithAlpha', () => {
    const red = color('#ff0000');
    const blue = color('#0000ff');
    const mixed = mixWithAlpha(red, blue, 0.5, 0.75);

    expect(mixed.alpha()).toBeCloseTo(0.75);
    // Result should be a purple-ish color
    expect(mixed.css()).toBe('rgb(180 0 180 / 0.75)');
  });

  it('converts to/from OKLCH without mutating inputs', () => {
    const base = color('#00ff00');
    const oklch = color.toOKLCH(base);
    expect(oklch).toBeDefined();
    const roundTrip = color.fromOKLCH(oklch!);

    expect(roundTrip.css()).toBe(base.css());
    expect(base.css()).toBe('rgb(0 255 0)');
  });

  it('treats modifier scale as full-range in OKLCH', () => {
    const lightened = color('#123456').lighten(1).value().rgb(false);
    lightened.forEach((channel) => {
      expect(channel).toBeGreaterThanOrEqual(254);
    });

    const darkened = color('#abcdef').darken(1).value().rgb(false);
    darkened.forEach((channel) => {
      expect(channel).toBeLessThanOrEqual(1);
    });
  });

  it('desaturate(1) produces grayscale', () => {
    const [
      r,
      g,
      b,
    ] = color('#E03035').desaturate(1).value().rgb(false);
    expect(Math.abs(r - g)).toBeLessThanOrEqual(1);
    expect(Math.abs(g - b)).toBeLessThanOrEqual(1);
    expect(Math.abs(r - b)).toBeLessThanOrEqual(1);
  });

  it('hueShift rotates hue while preserving alpha', () => {
    const base = color('#ff0000').alpha(0.4);
    const shifted = base.hueShift(m(120, 'deg'));

    const baseOklch = color.toOKLCH(base);
    const shiftedOklch = color.toOKLCH(shifted);
    const circularDiff = (a: number, b: number) => {
      const diff = Math.abs(a - b) % 360;
      return diff > 180 ? 360 - diff : diff;
    };

    expect(base.css()).toBe('rgb(255 0 0 / 0.4)');
    expect(baseOklch).toBeDefined();
    expect(shiftedOklch).toBeDefined();
    const expectedHue = ((baseOklch!.h ?? 0) + 120 + 360) % 360;
    expect(
      circularDiff(shiftedOklch!.h ?? 0, expectedHue),
    ).toBeLessThanOrEqual(10);
    expect(shifted.alpha()).toBeCloseTo(0.4);
  });

  it('hueShift wraps hue for negative degrees', () => {
    const base = color('#00ff00');
    const shifted = base.hueShift(m(-120, 'deg'));
    const baseOklch = color.toOKLCH(base);
    const shiftedOklch = color.toOKLCH(shifted);
    const circularDiff = (a: number, b: number) => {
      const diff = Math.abs(a - b) % 360;
      return diff > 180 ? 360 - diff : diff;
    };

    expect(baseOklch).toBeDefined();
    expect(shiftedOklch).toBeDefined();
    const expectedHue = ((baseOklch!.h ?? 0) - 120 + 360) % 360;
    expect(
      circularDiff(shiftedOklch!.h ?? 0, expectedHue),
    ).toBeLessThanOrEqual(10);
  });

  it('blend.multiply defaults to white and reduces alpha for near-white', () => {
    const base = color('#e7e7e7').alpha(1);
    const blended = base.blend.multiply();

    const [
      r,
      g,
      b,
    ] = blended.value().rgb(false);
    expect([
      Math.round(r),
      Math.round(g),
      Math.round(b),
    ]).toEqual([
      231,
      231,
      231,
    ]);
    expect(blended.alpha()).toBeCloseTo(0.094, 3);
  });

  it('blend.screen defaults to black and reduces alpha for near-black', () => {
    const base = color('#111111').alpha(1);
    const blended = base.blend.screen();

    const [
      r,
      g,
      b,
    ] = blended.value().rgb(false);
    expect([
      Math.round(r),
      Math.round(g),
      Math.round(b),
    ]).toEqual([
      17,
      17,
      17,
    ]);
    expect(blended.alpha()).toBeCloseTo(0.067, 3);
  });

  it('blend.multiply preserves alpha and applies ratio strength', () => {
    const base = color('#808080').alpha(0.5);
    const target = color('#ffffff').alpha(0.25);

    const full = base.blend.multiply({
      stripColor: target,
      ratio: 1,
    });
    const half = base.blend.multiply({
      stripColor: target,
      ratio: 0.5,
    });
    const none = base.blend.multiply({
      stripColor: target,
      ratio: 0,
    });

    expect(full.alpha()).toBeCloseTo(0.5 * 0.498, 3);
    expect(half.alpha()).toBeCloseTo(0.5 * 0.749, 3);
    expect(none.alpha()).toBeCloseTo(0.5, 3);
  });

  it('blend.screen supports ratio edge cases', () => {
    const base = color('#808080').alpha(0.4);

    const full = base.blend.screen({ ratio: 1 });
    const half = base.blend.screen({ ratio: 0.5 });
    const none = base.blend.screen({ ratio: 0 });

    expect(full.alpha()).toBeCloseTo(0.4 * 0.502, 3);
    expect(half.alpha()).toBeCloseTo(0.4 * 0.751, 3);
    expect(none.alpha()).toBeCloseTo(0.4, 3);
  });

  it('blend.screen keeps color values while keying to custom target', () => {
    const base = color('#123456').alpha(0.25);
    const target = color('#123456');
    const blended = base.blend.screen({ stripColor: target });

    expect(blended.css()).toBe('rgb(18 52 86 / 0)');
  });

  it('supports symbolic Highlight color', () => {
    const highlight = color('Highlight');
    expect(highlight.css()).toBe('Highlight');
    expect(highlight.alpha()).toBe(1);
  });
});

/* ------------------------------------------------------------------ *
 * INPUTS — every supported way to construct a colour.
 * Mirrors the "Inputs" table in design.md. Verified outputs.
 * ------------------------------------------------------------------ */
describe('colours — inputs (supported)', () => {
  it('css string: named / hex / rgb / hsl / oklch via chroma', () => {
    expect(color('rebeccapurple').css()).toBe('rgb(102 51 153)');
    expect(color('#ff0000').css()).toBe('rgb(255 0 0)');
    expect(color('rgb(255, 0, 0)').css()).toBe('rgb(255 0 0)');
  });

  it('create.hex normalizes a bare or #-prefixed hex', () => {
    expect(color.create.hex('ff0000').css()).toBe('rgb(255 0 0)');
    expect(color.create.hex('#ff0000').css()).toBe('rgb(255 0 0)');
  });

  it('create.rgba accepts 0-255 and 0-1 channels, with optional alpha', () => {
    expect(color.create.rgba(255, 0, 0).css()).toBe('rgb(255 0 0)');
    expect(color.create.rgba(1, 0, 0, 0.5).css()).toBe(
      'rgb(255 0 0 / 0.5)',
    );
  });

  it('create.hsl accepts percent and 0-1 saturation/lightness', () => {
    expect(color.create.hsl(120, 100, 50).css()).toBe('rgb(0 255 0)');
    expect(color.create.hsl(120, 1, 0.5, 0.5).css()).toBe(
      'rgb(0 255 0 / 0.5)',
    );
  });

  it('create.oklch accepts a string or l/c/h numbers', () => {
    expect(color.create.oklch('70% 0.1 200').css()).toBe(
      'rgb(64 177 183)',
    );
    expect(color.create.oklch(0.7, 0.1, 200).css()).toBe(
      'rgb(64 177 183)',
    );
  });

  it('color.lch and color.oklch (culori object) construct colours', () => {
    expect(color.lch(70, 40, 200).css()).toBe('rgb(0 190 195)');
    expect(
      color.oklch({ mode: 'oklch', l: 0.7, c: 0.1, h: 200 }).css(),
    ).toBe('rgb(64 177 183)');
  });

  it('symbolic colours pass through untouched (case-insensitive highlight)', () => {
    expect(color('currentColor').css()).toBe('currentColor');
    expect(color('highlight').css()).toBe('Highlight');
    expect(color('Highlight').css()).toBe('Highlight');
  });

  it('"transparent" is parsed to a real colour, not kept as a keyword', () => {
    // NOTE: input does not preserve the keyword; only output can re-emit it
    // (see preferKeywordTransparent). Tracked as an input gap in design.md.
    expect(color('transparent').css()).toBe('rgb(0 0 0 / 0)');
  });

  it('re-wraps an existing wrapper or chroma Color (idempotent)', () => {
    const base = color('#3366cc');
    expect(color(base).css()).toBe(base.css());
    expect(color(base.unsafeColor).css()).toBe(base.css());
  });
});

/* ------------------------------------------------------------------ *
 * MODIFICATIONS — the chainable, immutable transform algebra.
 * Mirrors the "Modifications" table in design.md.
 * ------------------------------------------------------------------ */
describe('colours — modifications (supported)', () => {
  const base = color('#3366cc');

  it('alpha: get returns the value, set returns a new colour', () => {
    expect(base.alpha()).toBe(1);
    expect(base.alpha(0.5).css()).toBe('rgb(51 102 204 / 0.5)');
    expect(base.alpha()).toBe(1); // original unchanged (immutable)
  });

  it('darken: partial and full', () => {
    expect(base.darken(0.2).css()).toBe('rgb(35 74 151)');
    expect(base.darken().css()).toBe('rgb(0 0 0)');
  });

  it('lighten and brighten are aliases (full-range to white)', () => {
    expect(base.brighten().css()).toBe('rgb(255 255 255)');
    expect(base.lighten().css()).toBe(base.brighten().css());
  });

  it('saturate increases chroma; desaturate(1) is grayscale', () => {
    expect(base.saturate().css()).toBe('rgb(0 87 250)');
    const [
      r,
      g,
      b,
    ] = color('#E03035').desaturate(1).value().rgb(false);
    expect(Math.abs(r - g)).toBeLessThanOrEqual(1);
    expect(Math.abs(g - b)).toBeLessThanOrEqual(1);
  });

  it('mix and mixSolid blend toward a target', () => {
    expect(base.mix('#ffffff', 0.5).css()).toBe('rgb(184 194 231)');
    expect(base.alpha(0.5).mixSolid('#ffffff', 0.5).css()).toBe(
      'rgb(184 194 231)',
    );
  });

  it('solid forces alpha to 1; clone is value-equal', () => {
    expect(base.alpha(0.2).solid().alpha()).toBe(1);
    expect(base.clone().css()).toBe(base.css());
  });
});

/* ------------------------------------------------------------------ *
 * OUTPUTS — every supported rendering of a colour.
 * Mirrors the "Outputs" table in design.md.
 * ------------------------------------------------------------------ */
describe('colours — outputs (supported)', () => {
  const c = color('#3366cc');

  it('css: modern space-separated rgb, with alpha when < 1', () => {
    expect(c.css()).toBe('rgb(51 102 204)');
    expect(c.alpha(0.5).css()).toBe('rgb(51 102 204 / 0.5)');
  });

  it('css options: forceAlpha (legacy rgba) and preferKeywordTransparent', () => {
    expect(c.css({ forceAlpha: true })).toBe('rgba(51, 102, 204, 1)');
    expect(c.alpha(0).css({ preferKeywordTransparent: true })).toBe(
      'transparent',
    );
  });

  it('hex and hsl are reachable today only via unsafeColor', () => {
    // These become first-class .hex()/.hsl() on the book (see design.md gaps).
    expect(c.unsafeColor.hex()).toBe('#3366cc');
    expect(c.unsafeColor.css('hsl')).toBe('hsl(220deg 60% 50%)');
  });

  it('OKLCH: object form (0-1 and 0-100) and formatted string', () => {
    const culori = color.toOKLCH(c);
    expect(culori?.l).toBeCloseTo(0.5325, 3);
    const modern = toModernOKLCH(c);
    expect(modern?.l).toBeCloseTo(53.248, 2);
    expect(fmtOKLCH({ l: 50, c: 0.1, h: 200 })).toBe(
      'oklch(50.000% 0.1000 200)',
    );
    expect(oklchToRgbString({ l: 50, c: 0.1, h: 200 })).toBe(
      'rgb(0 116 122)',
    );
  });

  it('colorModern emits oklch(); colorFallback emits rgb()', () => {
    expect(colorModern(c).startsWith('oklch(')).toBe(true);
    expect(colorFallback(c)).toBe('rgb(51 102 204)');
  });
});

/* ------------------------------------------------------------------ *
 * GAPS — documented-but-unbuilt surface. These are todos so the spec
 * in design.md and the test file stay in lockstep. Implement in a
 * later pass, then turn each into a real assertion.
 * ------------------------------------------------------------------ */
describe('colours — gaps (not yet supported)', () => {
  // Inputs
  it.todo(
    'color() accepts a bare OKLCH object ({ l, c, h }) directly',
  );
  it.todo('"transparent" can be kept as a symbolic input keyword');
  it.todo(
    'lab() / lch() / display-p3 / hwb string inputs as first-class',
  );

  // Modifications
  it.todo('absolute setters: setLightness / setChroma / setHue');
  it.todo('contrast / ensureContrast (WCAG-aware adjustment)');
  it.todo('conveniences: complement (hue + 180), invert, grayscale');
  it.todo('additional blend modes beyond multiply / screen');

  // Outputs (the book exposes format selection via .css(format); alpha-aware hex
  // is done as colorFormats.hexAlpha. These remain.)
  it.todo('lab() / lch() / display-p3 / color() function outputs');
});
