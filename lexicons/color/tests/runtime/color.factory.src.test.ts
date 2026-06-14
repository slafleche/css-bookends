import { describe, expect, it, vi } from 'vitest';

import * as colorPackage from '../../src';
import { colorFormats, publishBookColor } from '../../src';

/*
 * The factory contract: the book is consumed ONLY through `publishBookColor` (never a
 * pre-built instance), and the factory takes the config options output / strictness /
 * transparent / omitOpaqueAlpha.
 */

describe('color — factory-only contract (no pre-built instance)', () => {
  it('exports the publishBookColor factory', () => {
    expect(typeof publishBookColor).toBe('function');
  });

  it('ships NO ready-made color instance - you must bind via the factory', () => {
    // a bare `color` export would let consumers skip the factory; there must be none.
    expect('color' in colorPackage).toBe(false);
    expect(
      (colorPackage as Record<string, unknown>).color,
    ).toBeUndefined();
  });

  it('the factory yields a usable, callable book', () => {
    const color = publishBookColor();
    expect(typeof color).toBe('function');
    expect(color('#3366cc').css()).toBe('rgba(51, 102, 204, 1)');
  });
});

describe('color — factory config #1: output (default format)', () => {
  it('binds the format that bare .css() renders', () => {
    const color = publishBookColor({
      config: { output: colorFormats.hex },
    });
    expect(color('#3366cc').css()).toBe('#3366cc');
  });

  it('defaults to rgba (alpha slot always shown)', () => {
    expect(publishBookColor()('#3366cc').css()).toBe(
      'rgba(51, 102, 204, 1)',
    );
  });
});

describe('color — factory config #2: transparent (alpha-0 rendering)', () => {
  const transparent = '#00000000'; // fully transparent

  it("defaults to the 'transparent' keyword", () => {
    expect(publishBookColor()(transparent).css()).toBe('transparent');
    // ...for any requested format, since it has no value to convert.
    expect(
      publishBookColor()(transparent).css(colorFormats.oklch),
    ).toBe('transparent');
  });

  it("'white' renders white at alpha 0", () => {
    const color = publishBookColor({
      config: { transparent: 'white' },
    });
    expect(color(transparent).css()).toBe('rgba(255, 255, 255, 0)');
  });

  it("'black' renders black at alpha 0", () => {
    const color = publishBookColor({
      config: { transparent: 'black' },
    });
    expect(color(transparent).css()).toBe('rgba(0, 0, 0, 0)');
  });
});

describe('color — factory config #3: omitOpaqueAlpha', () => {
  it('off by default: opaque still shows the alpha slot', () => {
    expect(publishBookColor()('#3366cc').css()).toBe(
      'rgba(51, 102, 204, 1)',
    );
    expect(
      publishBookColor()('#3366cc').css(colorFormats.oklch),
    ).toMatch(/ \/ 1\)$/);
  });

  it('on: opaque drops the optional slot (rgba -> rgb, oklch loses / 1)', () => {
    const color = publishBookColor({
      config: { omitOpaqueAlpha: true },
    });
    expect(color('#3366cc').css()).toBe('rgb(51, 102, 204)');
    expect(color('#3366cc').css(colorFormats.oklch)).not.toContain(
      '/',
    );
  });

  it('on: a transparent color still shows its alpha', () => {
    const color = publishBookColor({
      config: { omitOpaqueAlpha: true, transparent: 'black' },
    });
    expect(color('#3366cc80').css()).toBe(
      'rgba(51, 102, 204, 0.502)',
    );
  });
});

describe('color — factory config #4: strictness (violation handling)', () => {
  it("'silent' suppresses the alpha-drop violation and still renders", () => {
    const color = publishBookColor({
      config: { strictness: 'silent' },
    });
    expect(color('#3366cc80').css(colorFormats.rgb)).toBe(
      'rgb(51, 102, 204)',
    );
  });

  it("'throw' raises on a violation regardless of env", () => {
    const color = publishBookColor({
      config: { strictness: 'throw' },
    });
    expect(() => color('#3366cc80').css(colorFormats.rgb)).toThrow();
  });

  it("'warn' logs a warning and still renders (does not throw)", () => {
    const spy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    const color = publishBookColor({
      config: { strictness: 'warn' },
    });
    expect(color('#3366cc80').css(colorFormats.rgb)).toBe(
      'rgb(51, 102, 204)',
    );
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
