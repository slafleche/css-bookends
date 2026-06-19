import { m } from '@css-bookends/css-calipers';
import { anchorSize } from '@css-bookends/spacing';
import { describe, expect, it } from 'vitest';

import { parsePadding } from '../../src/padding';
import type { PaddingInput } from '../../src/types';

/*
 * INPUT step of the padding BOOK. Padding's domain = the spacing lexicon narrowed to
 * non-negative measurements + the CSS-wide keywords. parsePadding validates, rejects auto /
 * anchor-size / negatives, and hardens each measurement (NonNegativeMeasurement). It keeps
 * the shorthand shape; spelling out is the later STORAGE step. Real assertions.
 */

describe('parsePadding — accepts the (hardened) padding domain', () => {
  it('accepts a scalar measurement (hardened, same instance) and 0', () => {
    const v = m(4);
    expect(parsePadding(v)).toBe(v);
    expect(parsePadding(0)).toBe(0);
  });

  it('accepts the CSS-wide keywords', () => {
    const keywords: PaddingInput[] = [
      'inherit',
      'initial',
      'unset',
      'revert',
      'revert-layer',
    ];
    for (const kw of keywords) {
      expect(parsePadding(kw)).toBe(kw);
    }
  });

  it('accepts the object form, preserving shape + values', () => {
    const x = m(4);
    const top = m(2);
    const input: PaddingInput = { x, top };
    expect(parsePadding(input)).toEqual({ x, top });
  });

  it('accepts four different (non-negative) units', () => {
    const input: PaddingInput = {
      top: m(1, 'px'),
      right: m(2, 'em'),
      bottom: m(3, 'rem'),
      left: m(4, 'vw'),
    };
    expect(parsePadding(input)).toEqual(input);
  });
});

describe('parsePadding — rejects out-of-domain values', () => {
  it('throws on a negative measurement (the nonNegative gate)', () => {
    expect(() => parsePadding(m(-4))).toThrow();
    expect(() => parsePadding({ y: m(-1) })).toThrow();
  });

  it('throws on auto', () => {
    expect(() => parsePadding('auto' as never)).toThrow();
  });

  it('throws on anchor-size()', () => {
    expect(() =>
      parsePadding(anchorSize({ size: 'width' }) as never),
    ).toThrow();
  });

  it('throws on an invalid string', () => {
    expect(() => parsePadding('invalid' as never)).toThrow();
  });
});
