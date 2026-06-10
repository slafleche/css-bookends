import { color } from '@css-bookends/colours';
import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { makeBorders } from '../../src';

const borders = makeBorders();
const red = color('red');

describe('borders — happy paths', () => {
  it('uniform border on all edges, with radius', () => {
    expect(borders({ width: m(1), style: 'solid', color: red, radius: m(8) }).css()).toEqual({
      borderTopWidth: '1px',
      borderRightWidth: '1px',
      borderBottomWidth: '1px',
      borderLeftWidth: '1px',
      borderTopStyle: 'solid',
      borderRightStyle: 'solid',
      borderBottomStyle: 'solid',
      borderLeftStyle: 'solid',
      borderTopColor: red.css(),
      borderRightColor: red.css(),
      borderBottomColor: red.css(),
      borderLeftColor: red.css(),
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      borderBottomRightRadius: '8px',
      borderBottomLeftRadius: '8px',
    });
  });

  it('no radius intent emits no radius keys', () => {
    expect(borders({ width: m(2), style: 'dashed', color: red }).css()).toEqual({
      borderTopWidth: '2px',
      borderRightWidth: '2px',
      borderBottomWidth: '2px',
      borderLeftWidth: '2px',
      borderTopStyle: 'dashed',
      borderRightStyle: 'dashed',
      borderBottomStyle: 'dashed',
      borderLeftStyle: 'dashed',
      borderTopColor: red.css(),
      borderRightColor: red.css(),
      borderBottomColor: red.css(),
      borderLeftColor: red.css(),
    });
  });

  it('a bare call renders the global defaults', () => {
    const themed = makeBorders({ width: m(1), style: 'solid', color: color('black') });
    expect(themed().css()).toMatchObject({
      borderTopWidth: '1px',
      borderTopStyle: 'solid',
      borderTopColor: color('black').css(),
    });
  });
});

describe('borders — edge overrides', () => {
  it('a partial edge override merges over the shorthand', () => {
    const b = borders({ width: m(1), color: red, bottom: { width: m(2) } }).css();
    expect(b.borderTopWidth).toBe('1px');
    expect(b.borderBottomWidth).toBe('2px');
    expect(b.borderBottomColor).toBe(red.css()); // keeps the shorthand colour
  });

  it('an axis override hits both edges (x = left + right)', () => {
    const b = borders({ width: m(1), x: { width: m(3) } }).css();
    expect(b.borderLeftWidth).toBe('3px');
    expect(b.borderRightWidth).toBe('3px');
    expect(b.borderTopWidth).toBe('1px');
  });
});

describe('borders — corners', () => {
  it('radius shorthand with a single corner override', () => {
    const b = borders({ radius: m(8), nw: m(0) }).css();
    expect(b.borderTopLeftRadius).toBe('0px');
    expect(b.borderTopRightRadius).toBe('8px');
    expect(b.borderBottomRightRadius).toBe('8px');
    expect(b.borderBottomLeftRadius).toBe('8px');
  });

  it('a pair sets its two corners, others stay absent', () => {
    const b = borders({ n: m(12) }).css();
    expect(b.borderTopLeftRadius).toBe('12px');
    expect(b.borderTopRightRadius).toBe('12px');
    expect(b.borderBottomRightRadius).toBeUndefined();
    expect(b.borderBottomLeftRadius).toBeUndefined();
  });

  it('precedence: all < pair < corner', () => {
    const b = borders({ radius: m(8), n: m(12), nw: m(4) }).css();
    expect(b.borderTopLeftRadius).toBe('4px'); // corner wins
    expect(b.borderTopRightRadius).toBe('12px'); // pair wins over all
    expect(b.borderBottomRightRadius).toBe('8px'); // all
    expect(b.borderBottomLeftRadius).toBe('8px');
  });

  it('an elliptical corner renders two values', () => {
    const b = borders({ nw: [m(12), m(24)] }).css();
    expect(b.borderTopLeftRadius).toBe('12px 24px');
  });
});

describe('borders — projection (read a single coordinate)', () => {
  it('reads resolved leaves via their own .css()', () => {
    const b = borders({ width: m(1), color: red });
    expect(b.top.width.css()).toBe('1px');
    expect(b.top.color.css()).toBe(red.css());
  });
});
