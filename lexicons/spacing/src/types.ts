import type { IMeasurement } from '@css-bookends/css-calipers';

export type Axis = 'top' | 'right' | 'bottom' | 'left';

/**
 * AxisValues:
 * - `all`: the same value on all four sides.
 * - `vertical`: the same value on top and bottom.
 * - `horizontal`: the same value on left and right.
 *
 * Explicit side keys (`top`/`right`/`bottom`/`left`) override the shorthands.
 */
export type AxisValues<T> = {
  all?: T;
  horizontal?: T;
  vertical?: T;
} & Partial<Record<Axis, T>>;

export type SpacingKeyword =
  | 'auto'
  | 'inherit'
  | 'initial'
  | 'unset'
  | 'revert'
  | 'revert-layer';

export type SpacingValue = IMeasurement | SpacingKeyword | 0;
