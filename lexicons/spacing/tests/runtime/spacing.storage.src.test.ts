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
 * out into the canonical four-side store. Scalar -> all four sides; `x`/`y` -> their axis;
 * an explicit side overrides its axis (side > axis); unset sides are omitted (partial).
 * Real assertions.
 */

describe('resolveSpacing — scalar shorthand', () => {
  it('fills all four sides with the value (same instance)', () => {
    const v = m(8);
    const store = resolveSpacing(v);
    expect(store).toEqual({ top: v, right: v, bottom: v, left: v });
    expect(store.top).toBe(v);
    expect(store.left).toBe(v);
  });

  it('works for 0 and keywords', () => {
    expect(resolveSpacing(0)).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
    expect(resolveSpacing('auto')).toEqual({
      top: 'auto',
      right: 'auto',
      bottom: 'auto',
      left: 'auto',
    });
  });
});

describe('resolveSpacing — object form (partial, side > axis)', () => {
  it('x fills left + right only (top/bottom omitted)', () => {
    const v = m(4);
    const store = resolveSpacing({ x: v });
    expect(store).toEqual({ left: v, right: v });
    expect('top' in store).toBe(false);
    expect('bottom' in store).toBe(false);
  });

  it('y fills top + bottom only', () => {
    const v = m(4);
    expect(resolveSpacing({ y: v })).toEqual({ top: v, bottom: v });
  });

  it('x + y fill all four', () => {
    const x = m(4);
    const y = m(8);
    expect(resolveSpacing({ x, y })).toEqual({
      left: x,
      right: x,
      top: y,
      bottom: y,
    });
  });

  it('an explicit side overrides its axis', () => {
    const y = m(8);
    const top = m(2);
    // y sets top + bottom; the explicit top then wins.
    expect(resolveSpacing({ y, top })).toEqual({ top, bottom: y });
  });

  it('mixed { x, y, top } - the side beats the y axis', () => {
    const x = m(4);
    const y = m(8);
    const top = m(2);
    expect(resolveSpacing({ x, y, top })).toEqual({
      left: x,
      right: x,
      top,
      bottom: y,
    });
  });

  it('full explicit sides pass through', () => {
    const top = m(1);
    const right = m(2);
    const bottom = m(3);
    const left = m(4);
    expect(resolveSpacing({ top, right, bottom, left })).toEqual({
      top,
      right,
      bottom,
      left,
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
    expect(store).toEqual({ top, right, bottom, left });
    expect(store.top).toBe(top);
    expect(store.left).toBe(left);
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
