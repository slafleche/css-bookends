import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { parsePadding, storePadding } from '../../src/padding';
import type { PaddingInput } from '../../src/types';

/*
 * STORAGE step of the padding BOOK. storePadding spells the hardened input (from parsePadding)
 * out into the canonical four-side store via the shared lexicon resolveSpacing. Driven through
 * the real pipeline storePadding(parsePadding(...)): scalar -> all four sides; x/y -> their
 * axis; an explicit side overrides its axis (side > axis); unset sides omitted. Real
 * assertions.
 */

const store = (input: PaddingInput) =>
  storePadding(parsePadding(input));

describe('storePadding — spell the hardened input out to the four-side store', () => {
  it('scalar fills all four sides', () => {
    const v = m(8);
    expect(store(v)).toEqual({
      top: v,
      right: v,
      bottom: v,
      left: v,
    });
  });

  it('x / y fill their axis only (partial)', () => {
    const v = m(4);
    const fromX = store({ x: v });
    expect(fromX.left).toBe(v);
    expect(fromX.right).toBe(v);
    expect(fromX.top).toBeUndefined();
    expect(fromX.bottom).toBeUndefined();
    expect(store({ y: v })).toEqual({ top: v, bottom: v });
  });

  it('an explicit side overrides its axis (side > axis)', () => {
    const y = m(8);
    const top = m(2);
    expect(store({ y, top })).toEqual({ top, bottom: y });
  });

  it('keeps four different units', () => {
    const input: PaddingInput = {
      top: m(1, 'px'),
      right: m(2, 'em'),
      bottom: m(3, 'rem'),
      left: m(4, 'vw'),
    };
    expect(store(input)).toEqual(input);
  });

  it('different shorthands converge to the same store', () => {
    const v = m(8);
    const fromScalar = store(v);
    expect(store({ x: v, y: v })).toEqual(fromScalar);
    expect(store({ top: v, right: v, bottom: v, left: v })).toEqual(
      fromScalar,
    );
  });
});
