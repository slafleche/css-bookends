import {
  isMeasurement,
  m,
  nonNegative,
} from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import {
  mapSpacingMeasurements,
  resolveSpacing,
} from '../../src/spacing';
import type { SpacingObject } from '../../src/types';

/*
 * STORAGE step of the spacing LEXICON: `resolveSpacing` spells a (validated) `SpacingInput`
 * out into the canonical four-side store of TAGGED SLOTS (`{ kind: 'length' | 'symbolic' }`,
 * modeled on the colour book's `Store`). Scalar -> all four sides; `x`/`y` -> their axis; an
 * explicit side overrides its axis (side > axis); unset sides are omitted (partial).
 */

/** Slot constructors mirroring `resolveSpacing`'s tagging, for terse assertions. */
const len = (value: unknown) => ({ kind: 'length', value });
const sym = (keyword: string) => ({ kind: 'symbolic', keyword });

describe('resolveSpacing — scalar shorthand', () => {
  it('fills all four sides with a length slot (value instance preserved)', () => {
    const v = m(8);
    const store = resolveSpacing(v);
    expect(store).toEqual({
      top: len(v),
      right: len(v),
      bottom: len(v),
      left: len(v),
    });
    // the measurement instance is preserved inside the length slot.
    expect((store.top as { value: unknown }).value).toBe(v);
  });

  it('tags 0 as a length slot and keywords as symbolic slots', () => {
    expect(resolveSpacing(0)).toEqual({
      top: len(0),
      right: len(0),
      bottom: len(0),
      left: len(0),
    });
    expect(resolveSpacing('auto')).toEqual({
      top: sym('auto'),
      right: sym('auto'),
      bottom: sym('auto'),
      left: sym('auto'),
    });
  });
});

describe('resolveSpacing — object form (partial, side > axis)', () => {
  it('x fills left + right only (top/bottom omitted)', () => {
    const v = m(4);
    const store = resolveSpacing({ x: v });
    expect(store).toEqual({ left: len(v), right: len(v) });
    expect('top' in store).toBe(false);
    expect('bottom' in store).toBe(false);
  });

  it('y fills top + bottom only', () => {
    const v = m(4);
    expect(resolveSpacing({ y: v })).toEqual({
      top: len(v),
      bottom: len(v),
    });
  });

  it('x + y fill all four', () => {
    const x = m(4);
    const y = m(8);
    expect(resolveSpacing({ x, y })).toEqual({
      left: len(x),
      right: len(x),
      top: len(y),
      bottom: len(y),
    });
  });

  it('an explicit side overrides its axis', () => {
    const y = m(8);
    const top = m(2);
    // y sets top + bottom; the explicit top then wins.
    expect(resolveSpacing({ y, top })).toEqual({
      top: len(top),
      bottom: len(y),
    });
  });

  it('mixed { x, y, top } - the side beats the y axis', () => {
    const x = m(4);
    const y = m(8);
    const top = m(2);
    expect(resolveSpacing({ x, y, top })).toEqual({
      left: len(x),
      right: len(x),
      top: len(top),
      bottom: len(y),
    });
  });

  it('full explicit sides pass through', () => {
    const top = m(1);
    const right = m(2);
    const bottom = m(3);
    const left = m(4);
    expect(resolveSpacing({ top, right, bottom, left })).toEqual({
      top: len(top),
      right: len(right),
      bottom: len(bottom),
      left: len(left),
    });
  });

  it('allows four different units across the sides', () => {
    const top = m(1, 'px');
    const right = m(2, 'em');
    const bottom = m(3, 'rem');
    const left = m(4, 'vw');
    // A book passes typed input (M = IMeasurement, unit-agnostic), so mixed units are fine.
    const input: SpacingObject = { top, right, bottom, left };
    const store = resolveSpacing(input);
    expect(store).toEqual({
      top: len(top),
      right: len(right),
      bottom: len(bottom),
      left: len(left),
    });
    expect((store.top as { value: unknown }).value).toBe(top);
    expect((store.left as { value: unknown }).value).toBe(left);
  });
});

describe('mapSpacingMeasurements — transform measurements, leave the rest', () => {
  it('maps a scalar measurement and leaves 0 / keywords untouched', () => {
    const v = m(4);
    // nonNegative.ensure returns the same instance, so the scalar passes through.
    expect(
      mapSpacingMeasurements(v, (x) => nonNegative.ensure(x)),
    ).toBe(v);
    expect(
      mapSpacingMeasurements(0, (x) => nonNegative.ensure(x)),
    ).toBe(0);
    expect(
      mapSpacingMeasurements('auto', (x) => nonNegative.ensure(x)),
    ).toBe('auto');
  });

  it('actually applies the transform to the measurement', () => {
    const out = mapSpacingMeasurements(m(4), (x) => x.double());
    expect(isMeasurement(out) && out.css()).toBe('8px');
  });

  it('maps every measurement in the object, preserving shape + non-measurements', () => {
    const x = m(4);
    const top = m(2);
    const input: SpacingObject = { x, top, y: 'auto' };
    const out = mapSpacingMeasurements(input, (val) =>
      nonNegative.ensure(val),
    );
    expect(out).toEqual({ x, top, y: 'auto' });
  });
});
