import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { parseMargin, storeMargin } from '../../src/margin';
import type { MarginInput } from '../../src/types';

/*
 * STORAGE step of the margin BOOK. storeMargin spells the (validated) input out into the
 * canonical four-side store of TAGGED SLOTS via the shared lexicon resolveSpacing: scalar ->
 * all four sides; x/y -> their axis; an explicit side overrides its axis (side > axis); unset
 * sides omitted.
 */

/** Length-slot constructor mirroring resolveSpacing's tagging. */
const len = (value: unknown) => ({ kind: 'length', value });

describe('storeMargin — spell out to the four-side store', () => {
  it('scalar fills all four sides (as length slots)', () => {
    const v = m(8);
    expect(storeMargin(v)).toEqual({
      top: len(v),
      right: len(v),
      bottom: len(v),
      left: len(v),
    });
  });

  it('x / y fill their axis only (partial)', () => {
    const v = m(4);
    const fromX = storeMargin({ x: v });
    expect(fromX.left).toEqual(len(v));
    expect(fromX.right).toEqual(len(v));
    expect(fromX.top).toBeUndefined();
    expect(fromX.bottom).toBeUndefined();
    expect(storeMargin({ y: v })).toEqual({
      top: len(v),
      bottom: len(v),
    });
  });

  it('an explicit side overrides its axis (side > axis)', () => {
    const y = m(8);
    const top = m(2);
    expect(storeMargin({ y, top })).toEqual({
      top: len(top),
      bottom: len(y),
    });
  });

  it('keeps four different units', () => {
    const top = m(1, 'px');
    const right = m(2, 'em');
    const bottom = m(3, 'rem');
    const left = m(4, 'vw');
    const input: MarginInput = { top, right, bottom, left };
    expect(storeMargin(input)).toEqual({
      top: len(top),
      right: len(right),
      bottom: len(bottom),
      left: len(left),
    });
  });

  it('different shorthands converge to the same store', () => {
    const v = m(8);
    const fromScalar = storeMargin(v);
    expect(storeMargin({ x: v, y: v })).toEqual(fromScalar);
    expect(
      storeMargin({ top: v, right: v, bottom: v, left: v }),
    ).toEqual(fromScalar);
  });

  it('composes after parseMargin (raw -> validated -> store)', () => {
    const x = m(4);
    const top = m(2);
    const input: MarginInput = { x, top };
    expect(storeMargin(parseMargin(input))).toEqual({
      left: len(x),
      right: len(x),
      top: len(top),
    });
  });
});
