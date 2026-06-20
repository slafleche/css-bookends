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

/** Length-slot constructor mirroring resolveSpacing's tagging. */
const len = (value: unknown) => ({ kind: 'length', value });

describe('storePadding — spell the hardened input out to the four-side store', () => {
  it('scalar fills all four sides (as length slots)', () => {
    const v = m(8);
    expect(store(v)).toEqual({
      top: len(v),
      right: len(v),
      bottom: len(v),
      left: len(v),
    });
  });

  it('x / y fill their axis only (partial)', () => {
    const v = m(4);
    const fromX = store({ x: v });
    expect(fromX.left).toEqual(len(v));
    expect(fromX.right).toEqual(len(v));
    expect(fromX.top).toBeUndefined();
    expect(fromX.bottom).toBeUndefined();
    expect(store({ y: v })).toEqual({ top: len(v), bottom: len(v) });
  });

  it('an explicit side overrides its axis (side > axis)', () => {
    const y = m(8);
    const top = m(2);
    expect(store({ y, top })).toEqual({
      top: len(top),
      bottom: len(y),
    });
  });

  it('keeps four different units', () => {
    const top = m(1, 'px');
    const right = m(2, 'em');
    const bottom = m(3, 'rem');
    const left = m(4, 'vw');
    const input: PaddingInput = { top, right, bottom, left };
    expect(store(input)).toEqual({
      top: len(top),
      right: len(right),
      bottom: len(bottom),
      left: len(left),
    });
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
