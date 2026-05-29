import { describe, expect, it } from 'vitest';
import { isSciNotation, sciNotation } from '../../../src/sciNotation';

describe('sciNotation helper (src)', () => {
  it('stores coefficient and exponent without collapsing to a float', () => {
    const value = sciNotation(1.5, -7, 'px');
    expect(value.coefficient()).toBe(1.5);
    expect(value.exponent()).toBe(-7);
    expect(value.getUnit()).toBe('px');
  });

  it('defaults the unit to px', () => {
    const value = sciNotation(2, 2);
    expect(value.getUnit()).toBe('px');
    expect(value.getValue()).toBe(200);
  });

  it('lowercases the unit', () => {
    expect(sciNotation(1, 0, 'EM').getUnit()).toBe('em');
  });

  it('computes the float value only on demand', () => {
    expect(sciNotation(5, 2).valueOf()).toBe(500);
    expect(sciNotation(5, 2).getValue()).toBe(500);
    expect(sciNotation(1.5, -7).valueOf()).toBe(1.5e-7);
  });

  it('matches the equivalent plain value', () => {
    expect(sciNotation(5, 2).getValue()).toBe(500);
    expect(sciNotation(3, 0).getValue()).toBe(3);
  });

  it('emits unit-bearing css at the edge', () => {
    expect(sciNotation(2, 2, 'px').css()).toBe('200px');
    expect(sciNotation(2, 2, 'px').toString()).toBe('200px');
  });

  it('derives new values immutably with withCoefficient / withExponent', () => {
    const base = sciNotation(2, 3, 'em');
    const reCoefficient = base.withCoefficient(5);
    const reExponent = base.withExponent(1);

    expect(reCoefficient.coefficient()).toBe(5);
    expect(reCoefficient.exponent()).toBe(3);
    expect(reCoefficient.getUnit()).toBe('em');
    expect(reExponent.coefficient()).toBe(2);
    expect(reExponent.exponent()).toBe(1);
    // original is unchanged
    expect(base.coefficient()).toBe(2);
    expect(base.exponent()).toBe(3);
  });

  it('rejects non-finite coefficient or exponent', () => {
    expect(() => sciNotation(Number.NaN, 1)).toThrow(
      'Scientific notation values must be finite numbers.',
    );
    expect(() => sciNotation(1, Number.POSITIVE_INFINITY)).toThrow(
      'Scientific notation values must be finite numbers.',
    );
  });

  it('rejects a non-integer exponent', () => {
    expect(() => sciNotation(1, 2.5)).toThrow(
      'Scientific notation exponent must be an integer.',
    );
  });

  it('recognizes sciNotation values with isSciNotation', () => {
    expect(isSciNotation(sciNotation(1, 0))).toBe(true);
    expect(isSciNotation({})).toBe(false);
    expect(isSciNotation(null)).toBe(false);
    expect(isSciNotation(42)).toBe(false);
  });
});
