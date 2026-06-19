import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { anchorSize, parseMargin } from '../../src/margin';
import type { MarginInput, SpacingKeyword } from '../../src/types';

/*
 * INPUT step of the margin BOOK. Margin's domain = the spacing lexicon's permissive default
 * (auto + negatives + anchor-size all allowed). `parseMargin` validates and returns the
 * input unchanged; spelling it out is the later STORAGE step. Real assertions.
 */

describe('parseMargin — accepts the margin domain, returns input unchanged', () => {
  it('accepts a scalar measurement and 0', () => {
    const v = m(8);
    expect(parseMargin(v)).toBe(v);
    expect(parseMargin(0)).toBe(0);
  });

  it('accepts every keyword (auto + CSS-wide)', () => {
    const keywords: SpacingKeyword[] = [
      'auto',
      'inherit',
      'initial',
      'unset',
      'revert',
      'revert-layer',
    ];
    for (const kw of keywords) {
      expect(parseMargin(kw)).toBe(kw);
    }
  });

  it('accepts the object form (axes and explicit sides)', () => {
    const axes = { x: m(4), y: m(8) };
    expect(parseMargin(axes)).toBe(axes);
    const sides = { top: m(2), left: m(0) };
    expect(parseMargin(sides)).toBe(sides);
  });

  it('accepts four different units across the sides', () => {
    const o: MarginInput = {
      top: m(1, 'px'),
      right: m(2, 'em'),
      bottom: m(3, 'rem'),
      left: m(4, 'vw'),
    };
    expect(parseMargin(o)).toBe(o);
  });

  it('accepts negative measurements (margin allows them)', () => {
    const neg = m(-4);
    expect(parseMargin(neg)).toBe(neg);
  });

  it('accepts anchor-size() (scalar and inside the object)', () => {
    const a = anchorSize({ size: 'width' });
    expect(parseMargin(a)).toBe(a);
    const o: MarginInput = {
      x: anchorSize({
        anchor: '--btn',
        size: 'inline',
        fallback: m(50),
      }),
    };
    expect(parseMargin(o)).toBe(o);
  });
});

describe('parseMargin — invalid input throws', () => {
  it('throws on an invalid scalar string', () => {
    expect(() => parseMargin('invalid' as never)).toThrow();
  });

  it('throws on an invalid value inside the object', () => {
    expect(() => parseMargin({ x: 'invalid' as never })).toThrow();
  });
});
