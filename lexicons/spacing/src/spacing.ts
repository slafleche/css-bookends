import {
  type IMeasurement,
  isMeasurement,
} from '@css-bookends/css-calipers';

import type {
  AnchorSize,
  AnchorSizeKeyword,
  AnchorSizeOptions,
  Axis,
  Side,
  SpacingInput,
  SpacingKeyword,
  SpacingObject,
  SpacingPolicy,
  SpacingStore,
  SpacingValue,
} from './types';

/* ============================================================================
 * Shared guts of the padding/margin books, factored into the spacing LEXICON. The
 * books compose two steps from here:
 *
 *   INPUT   - `parseSpacing(input, policy)`: accept a permissive `SpacingInput`
 *             (scalar shorthand or `{ x, y, top, right, bottom, left }`), VALIDATE its
 *             shape + each value against the book's policy, and return it unchanged.
 *   STORAGE - `resolveSpacing(input)`: spell the shorthand out into the canonical
 *             four-side `SpacingStore`. The spell-out mechanics are identical for
 *             padding and margin, so they live here, shared and generic over the value
 *             type; the value-domain differences are handled at INPUT.
 *
 * Expandable: a `SpacingPolicy` lets a book forbid `auto`, negatives, and/or
 * `anchor-size()` (the padding/margin spec split). Each flag defaults to allowed;
 * `false` -> violation.
 * ==========================================================================*/

const SPACING_KEYWORDS = new Set<SpacingKeyword>([
  'auto',
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
]);

const ANCHOR_SIZE_KEYWORDS = new Set<AnchorSizeKeyword>([
  'width',
  'height',
  'block',
  'inline',
  'self-block',
  'self-inline',
]);

const OBJECT_KEYS: ReadonlyArray<Axis | Side> = [
  'x',
  'y',
  'top',
  'right',
  'bottom',
  'left',
];

const isAnchorSize = (value: unknown): value is AnchorSize =>
  typeof value === 'object' &&
  value !== null &&
  (value as { kind?: unknown }).kind === 'anchorSize';

/**
 * Build a margin-only `anchor-size()` value, e.g.
 * `anchorSize({ anchor: '--btn', size: 'width', fallback: m(50) })`.
 */
export const anchorSize = (
  options: AnchorSizeOptions = {},
): AnchorSize => {
  if (
    options.anchor !== undefined &&
    !options.anchor.startsWith('--')
  ) {
    throw new Error(
      `spacing: anchor name must be a dashed-ident (got "${options.anchor}")`,
    );
  }
  if (
    options.size !== undefined &&
    !ANCHOR_SIZE_KEYWORDS.has(options.size)
  ) {
    throw new Error(
      `spacing: invalid anchor-size keyword "${String(options.size)}"`,
    );
  }
  return { kind: 'anchorSize', ...options };
};

/** A valid single spacing value: `0`, a known keyword, a measurement, or anchor-size(). */
const isSpacingValue = (value: unknown): value is SpacingValue =>
  value === 0 ||
  (typeof value === 'string' &&
    SPACING_KEYWORDS.has(value as SpacingKeyword)) ||
  isMeasurement(value) ||
  isAnchorSize(value);

/** Enforce the book's value-domain policy on one value. */
const checkValue = (
  key: string,
  value: SpacingValue,
  policy: SpacingPolicy,
): void => {
  if (value === 'auto' && policy.auto === false) {
    throw new Error(`spacing: "auto" is not allowed for "${key}"`);
  }
  if (
    isMeasurement(value) &&
    value.getValue() < 0 &&
    policy.negative === false
  ) {
    throw new Error(
      `spacing: a negative value is not allowed for "${key}"`,
    );
  }
  if (isAnchorSize(value) && policy.anchorSize === false) {
    throw new Error(
      `spacing: anchor-size() is not allowed for "${key}"`,
    );
  }
};

/**
 * Validate a `SpacingInput` against the book's value-domain `policy` (default: `auto`,
 * negatives, and anchor-size() all allowed) and return it unchanged. Spelling it out
 * into the four sides is the book's storage step, not this.
 */
export const parseSpacing = <
  M extends IMeasurement = IMeasurement,
  K extends SpacingKeyword = SpacingKeyword,
  F extends AnchorSize = AnchorSize,
>(
  input: SpacingInput<M, K, F>,
  policy: SpacingPolicy = {},
): SpacingInput<M, K, F> => {
  const raw: SpacingInput = input;

  // scalar shorthand: a single value.
  if (isSpacingValue(raw)) {
    checkValue('value', raw, policy);
    return input;
  }

  // object form: validate every provided key against the value domain + policy.
  if (typeof raw === 'object' && raw !== null) {
    for (const key of OBJECT_KEYS) {
      const value = raw[key];
      if (value === undefined) continue;
      if (!isSpacingValue(value)) {
        throw new Error(`spacing: invalid value for "${key}"`);
      }
      checkValue(key, value, policy);
    }
    return input;
  }

  throw new Error(`spacing: unsupported input "${String(raw)}"`);
};

/**
 * STORAGE step (shared): spell a validated `SpacingInput` out into the canonical four-side
 * `SpacingStore`. A scalar fills all four sides; `x`/`y` fill their axis; an explicit side
 * overrides its axis (precedence side > axis); unset sides are omitted (partial store).
 *
 * Assumes the input was already validated by `parseSpacing` (parse-don't-validate): this
 * only resolves shape, it does not re-check the value domain.
 */
export const resolveSpacing = <
  M extends IMeasurement = IMeasurement,
  K extends SpacingKeyword = SpacingKeyword,
  F extends AnchorSize = AnchorSize,
>(
  input: SpacingInput<M, K, F>,
): SpacingStore<M, K, F> => {
  const raw: SpacingInput = input;

  // scalar shorthand: every side takes the value.
  if (isSpacingValue(raw)) {
    return {
      top: raw,
      right: raw,
      bottom: raw,
      left: raw,
    } as SpacingStore<M, K, F>;
  }

  // object form (raw is narrowed to SpacingObject here): axes first, then explicit sides
  // override (precedence side > axis).
  const store: SpacingStore = {};
  if (raw.x !== undefined) {
    store.left = raw.x;
    store.right = raw.x;
  }
  if (raw.y !== undefined) {
    store.top = raw.y;
    store.bottom = raw.y;
  }
  if (raw.top !== undefined) store.top = raw.top;
  if (raw.right !== undefined) store.right = raw.right;
  if (raw.bottom !== undefined) store.bottom = raw.bottom;
  if (raw.left !== undefined) store.left = raw.left;
  return store as SpacingStore<M, K, F>;
};

/**
 * Map a transform over every MEASUREMENT in a (validated) `SpacingInput`, preserving the
 * shape (scalar or object) and leaving `0` / keywords / `anchor-size()` untouched. The
 * padding book uses this to harden each measurement to `NonNegativeMeasurement` by running
 * it through the `nonNegative` refinement.
 */
export const mapSpacingMeasurements = <
  M2 extends IMeasurement,
  K extends SpacingKeyword = SpacingKeyword,
  F extends AnchorSize = AnchorSize,
>(
  input: SpacingInput<IMeasurement, K, F>,
  fn: (measurement: IMeasurement) => M2,
): SpacingInput<M2, K, F> => {
  const mapValue = (value: SpacingValue): SpacingValue =>
    isMeasurement(value) ? fn(value) : value;

  const raw: SpacingInput = input;

  // scalar shorthand.
  if (isSpacingValue(raw)) {
    return mapValue(raw) as SpacingValue<M2, K, F>;
  }

  // object form (raw is narrowed to SpacingObject here): map each present value.
  const out: SpacingObject = {};
  for (const key of OBJECT_KEYS) {
    const value = raw[key];
    if (value !== undefined) out[key] = mapValue(value);
  }
  return out as SpacingObject<M2, K, F>;
};
