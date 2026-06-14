import { describe, expect, it } from 'vitest';

import { colorFormats, publishBookColor } from '../../src/color';

/*
 * OUTPUT step (Part 3): formats + `.css()`. Default is rgba with the alpha slot always
 * shown; alpha-capable formats always render the slot; `rgb`/`hex` carry no alpha and
 * dropping a real alpha is a strictness-governed violation; out-of-gamut on a narrow
 * format is likewise a violation. Real assertions (no `it.todo`).
 */

const color = publishBookColor();

describe('color output — default format is rgba, alpha slot always shown', () => {
  it('opaque color shows alpha 1', () => {
    expect(color('#3366cc').css()).toBe('rgba(51, 102, 204, 1)');
  });

  it('transparent color shows its real alpha', () => {
    expect(color('#3366cc80').css()).toBe(
      'rgba(51, 102, 204, 0.502)',
    );
  });
});

describe('color output — every alpha-capable format always renders its slot', () => {
  it('oklch shows / 1 when opaque', () => {
    expect(color('#3366cc').oklch().css()).toMatch(
      /^oklch\(.+ \/ 1\)$/,
    );
  });

  it('hsl shows / 1 when opaque', () => {
    expect(color('#3366cc').hsl().css()).toMatch(/^hsl\(.+ \/ 1\)$/);
  });

  it('hexAlpha carries the alpha byte', () => {
    expect(color('#3366cc').hexAlpha().css()).toBe('#3366ccff');
  });
});

describe('color output — selectors and one-off .css(format)', () => {
  it('.css(format) renders a one-off format', () => {
    expect(color('#3366cc').css(colorFormats.hex)).toBe('#3366cc');
  });

  it('selector then .css() is equivalent', () => {
    expect(color('#3366cc').hex().css()).toBe('#3366cc');
  });

  it('displayP3 renders the color() function', () => {
    expect(color('#3366cc').displayP3().css()).toMatch(
      /^color\(display-p3 .+ \/ 1\)$/,
    );
  });
});

describe('color output — factory binds the default format', () => {
  it('publishBookColor config overrides the default output', () => {
    const hexColor = publishBookColor({
      config: { output: colorFormats.hex },
    });
    expect(hexColor('#3366cc').css()).toBe('#3366cc');
  });
});

describe('color output — never silently drop alpha', () => {
  it("rgb on a transparent color throws in dev (strictness 'auto')", () => {
    expect(() => color('#3366cc80').css(colorFormats.rgb)).toThrow();
  });

  it("hex on a transparent color throws in dev (strictness 'auto')", () => {
    expect(() => color('#3366cc80').css(colorFormats.hex)).toThrow();
  });

  it("strictness 'silent' drops the alpha without complaint", () => {
    const lax = publishBookColor({
      config: { strictness: 'silent' },
    });
    expect(lax('#3366cc80').css(colorFormats.rgb)).toBe(
      'rgb(51, 102, 204)',
    );
  });

  it('opaque color into rgb is fine (no alpha to drop)', () => {
    expect(color('#3366cc').css(colorFormats.rgb)).toBe(
      'rgb(51, 102, 204)',
    );
  });
});

describe('color output — out-of-gamut is a strictness-governed violation', () => {
  const wide = 'oklch(0.7 0.37 150)'; // far outside sRGB

  it('throws in dev when rendered to a narrow (sRGB) format', () => {
    expect(() => color(wide).css(colorFormats.rgb)).toThrow();
  });

  it("strictness 'silent' clamps to a valid in-gamut value", () => {
    const lax = publishBookColor({
      config: { strictness: 'silent' },
    });
    expect(lax(wide).css(colorFormats.rgb)).toMatch(
      /^rgb\(\d+, \d+, \d+\)$/,
    );
  });

  it('wide-gamut formats (oklch) keep it without complaint', () => {
    expect(color(wide).oklch().css()).toMatch(/^oklch\(.+ \/ 1\)$/);
  });
});
