export interface ISciNotation {
  coefficient: () => number;
  exponent: () => number;
  getUnit: () => string;
  css: () => string;
  toString: () => string;
  valueOf: () => number;
  getValue: () => number;
  withCoefficient: (coefficient: number) => ISciNotation;
  withExponent: (exponent: number) => ISciNotation;
}

class SciNotationImpl implements ISciNotation {
  #coefficient: number;
  #exponent: number;
  #unit: string;

  constructor(coefficient: number, exponent: number, unit = 'px') {
    if (!Number.isFinite(coefficient) || !Number.isFinite(exponent)) {
      throw new Error(
        'Scientific notation values must be finite numbers.',
      );
    }
    if (!Number.isInteger(exponent)) {
      throw new Error(
        'Scientific notation exponent must be an integer.',
      );
    }
    this.#coefficient = coefficient;
    this.#exponent = exponent;
    this.#unit = unit.toLowerCase();
  }

  coefficient(): number {
    return this.#coefficient;
  }

  exponent(): number {
    return this.#exponent;
  }

  getUnit(): string {
    return this.#unit;
  }

  valueOf(): number {
    return this.#coefficient * 10 ** this.#exponent;
  }

  getValue(): number {
    return this.valueOf();
  }

  css(): string {
    return `${this.valueOf()}${this.#unit}`;
  }

  toString(): string {
    return this.css();
  }

  withCoefficient(coefficient: number): ISciNotation {
    return new SciNotationImpl(coefficient, this.#exponent, this.#unit);
  }

  withExponent(exponent: number): ISciNotation {
    return new SciNotationImpl(this.#coefficient, exponent, this.#unit);
  }
}

export function sciNotation(
  coefficient: number,
  exponent: number,
  unit = 'px',
): ISciNotation {
  return new SciNotationImpl(coefficient, exponent, unit);
}

export const isSciNotation = (value: unknown): value is ISciNotation => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'coefficient' in value &&
    'exponent' in value &&
    'getUnit' in value &&
    typeof (value as ISciNotation).coefficient === 'function' &&
    typeof (value as ISciNotation).exponent === 'function' &&
    typeof (value as ISciNotation).getUnit === 'function'
  );
};
