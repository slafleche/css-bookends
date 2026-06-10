import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import {
  color,
  mixWithAlpha,
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
    const [r, g, b] = color('#E03035').desaturate(1).value().rgb(false);
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
    const expectedHue =
      ((baseOklch!.h ?? 0) + 120 + 360) % 360;
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
    const expectedHue =
      ((baseOklch!.h ?? 0) - 120 + 360) % 360;
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
    expect([Math.round(r), Math.round(g), Math.round(b)]).toEqual([
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
    expect([Math.round(r), Math.round(g), Math.round(b)]).toEqual([
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
