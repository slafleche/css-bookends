import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { colorFormats, bookPressColours } from '../../src';

const colours = bookPressColours();

describe('colours book — factory + bare call', () => {
  it('a bare call resolves the configured base colour', () => {
    expect(bookPressColours()().css()).toBe('rgb(0 0 0)'); // default base 'black'
    expect(bookPressColours({ base: 'red' })().css()).toBe('rgb(255 0 0)');
  });

  it('delegates parsing to the existing color() helper', () => {
    expect(colours('#3366cc').css()).toBe('rgb(51 102 204)');
    expect(colours('rebeccapurple').css()).toBe('rgb(102 51 153)');
  });
});

describe('colours book — output is always .css(), format is a typed object', () => {
  const c = colours('#3366cc');

  it('.css() renders the factory-configured format', () => {
    expect(c.css()).toBe('rgb(51 102 204)'); // default colorFormats.css
    expect(bookPressColours({ output: colorFormats.hex })('#3366cc').css()).toBe('#3366cc');
    expect(
      bookPressColours({ output: colorFormats.oklch })('#3366cc').css().startsWith('oklch('),
    ).toBe(true);
  });

  it('.css(colorFormats.X) overrides the format for a one-off', () => {
    expect(c.css(colorFormats.hex)).toBe('#3366cc');
    expect(c.css(colorFormats.hsl)).toBe('hsl(220deg 60% 50%)');
    expect(c.css(colorFormats.oklch).startsWith('oklch(')).toBe(true);
    expect(c.css(colorFormats.modern).startsWith('oklch(')).toBe(true);
    expect(c.css(colorFormats.rgb)).toBe('rgb(51 102 204)');
  });

  it('option variants are named presets: rgbLegacy and hexAlpha', () => {
    expect(c.css(colorFormats.rgbLegacy)).toBe('rgba(51, 102, 204, 1)');
    expect(c.alpha(0.5).css(colorFormats.hexAlpha)).toBe('#3366cc80');
  });

  it('format selectors return a colour, render via .css() (== .css(format))', () => {
    expect(c.hex().css()).toBe(c.css(colorFormats.hex));
    expect(c.hsl().css()).toBe('hsl(220deg 60% 50%)');
    expect(c.oklch().css().startsWith('oklch(')).toBe(true);
    // a selector returns a ResolvedColour, not a string
    expect(typeof c.hex().css).toBe('function');
    expect(typeof c.hex().darken).toBe('function');
  });

  it('selectors carry their typed options too', () => {
    expect(c.rgb({ legacy: true }).css()).toBe('rgba(51, 102, 204, 1)');
    expect(c.alpha(0.5).hex({ alpha: true }).css()).toBe('#3366cc80');
  });

  it('a selected format persists through later modifications', () => {
    expect(c.hex().darken(0.2).css()).toBe(c.darken(0.2).css(colorFormats.hex));
  });
});

describe('colours book — modifications return new resolved colours', () => {
  it('chains and stays navigable', () => {
    const r = colours('#3366cc').darken(0.2);
    expect(r.css()).toBe('rgb(35 74 151)');
    expect(typeof r.darken).toBe('function'); // still a ResolvedColour
    expect(r.darken(0.2).mix('#ffffff', 0.5).css()).toMatch(/^rgb\(/);
  });

  it('alpha keeps its dual get/set shape', () => {
    const c = colours('#3366cc');
    expect(c.alpha()).toBe(1);
    expect(c.alpha(0.5).css()).toBe('rgb(51 102 204 / 0.5)');
  });

  it('hueShift takes a calipers degree measurement', () => {
    const shifted = colours('#ff0000').hueShift(m(120, 'deg'));
    expect(shifted.css()).toMatch(/^rgb\(/);
  });

  it('wrapper() exposes the underlying immutable wrapper', () => {
    expect(colours('#3366cc').wrapper().css()).toBe('rgb(51 102 204)');
  });
});
