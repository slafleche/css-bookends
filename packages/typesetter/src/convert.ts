// The core of the typesetter (v0): ONE decision function, `convertToken`, that
// takes any single DTCG token (with a resolved `$type`) and returns the
// most-constrained-yet-accurate calipers primitive. The per-type logic IS the
// decision table inside it. Helpers below are internal; the public surface is
// `convertToken` plus its result/error types.

import {
  color,
  type ColorObject,
  f,
  hardenInteger,
  i,
  type IFloat,
  type IInteger,
  type IMeasurement,
  m,
  type ResolvedColor,
} from '@css-bookends/css-calipers';

import { TypesetterError } from './errors';
import type {
  ColorValue,
  DimensionValue,
  DtcgColorSpace,
  DtcgToken,
  DurationValue,
  FontWeightKeyword,
  SupportedTokenType,
  UnsupportedResult,
  UnsupportedTokenType,
} from './types';

/* ----------------------------------------------------------------------------
 * The result shape. A supported token yields a tagged calipers primitive; an
 * unsupported one yields the documented sentinel.
 * -------------------------------------------------------------------------- */

/** A successfully converted token: the calipers primitive plus what it is. */
export type ConvertedToken =
  | {
      kind: 'measurement';
      type: SupportedTokenType;
      value: IMeasurement;
    }
  | { kind: 'integer'; type: 'number'; value: IInteger }
  | { kind: 'float'; type: 'number'; value: IFloat }
  | { kind: 'color'; type: 'color'; value: ResolvedColor }
  | { kind: 'fontWeight'; type: 'fontWeight'; value: IInteger }
  | { kind: 'keyword'; type: 'fontWeight'; value: FontWeightKeyword };

/** What `convertToken` returns: a converted primitive, or a deferral sentinel. */
export type ConvertResult = ConvertedToken | UnsupportedResult;

/* ----------------------------------------------------------------------------
 * Static decision data.
 * -------------------------------------------------------------------------- */

/** The eight DTCG types deferred to the (TBD) composite workflow. */
const UNSUPPORTED_TYPES: readonly UnsupportedTokenType[] = [
  'fontFamily',
  'cubicBezier',
  'strokeStyle',
  'border',
  'transition',
  'shadow',
  'gradient',
  'typography',
];

const UNSUPPORTED_TYPE_SET: ReadonlySet<string> = new Set(
  UNSUPPORTED_TYPES,
);

/**
 * The DTCG fontWeight named aliases. A keyword `$value` passes through; anything
 * else of `$type: fontWeight` must be a number, hardened into [1, 1000].
 */
const FONT_WEIGHT_KEYWORDS: ReadonlySet<string> =
  new Set<FontWeightKeyword>([
    'thin',
    'hairline',
    'extra-light',
    'ultra-light',
    'light',
    'normal',
    'regular',
    'book',
    'medium',
    'semi-bold',
    'demi-bold',
    'bold',
    'extra-bold',
    'ultra-bold',
    'black',
    'heavy',
    'extra-black',
    'ultra-black',
  ]);

/** The constrained fontWeight helper: a calipers integer hardened to [1, 1000]. */
const fontWeight = hardenInteger({ min: 1, max: 1000 });

/* ----------------------------------------------------------------------------
 * Small validation helpers (internal). Each throws a `TypesetterError` with the
 * offending `$type` so a malformed supported token never silently mis-converts.
 * -------------------------------------------------------------------------- */

const isPlainObject = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value);

const ensureFinite = (
  value: unknown,
  type: SupportedTokenType,
  label: string,
): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypesetterError(
      type,
      `${label} must be a finite number (got ${String(value)})`,
    );
  }
  return value;
};

/* ----------------------------------------------------------------------------
 * Per-type converters (the decision table, one cell each).
 * -------------------------------------------------------------------------- */

/** DTCG `dimension` { value, unit } -> m(value, unit). Units px | rem. */
const convertDimension = (raw: unknown): IMeasurement => {
  if (!isPlainObject(raw)) {
    throw new TypesetterError(
      'dimension',
      'dimension $value must be an object { value, unit }',
    );
  }
  const { value, unit } = raw as Partial<DimensionValue>;
  const numeric = ensureFinite(value, 'dimension', 'dimension value');
  if (unit !== 'px' && unit !== 'rem') {
    throw new TypesetterError(
      'dimension',
      `dimension unit must be "px" or "rem" (got ${String(unit)})`,
    );
  }
  return m(numeric, unit);
};

/** DTCG `duration` { value, unit } -> m(value, unit). A time measurement: ms | s. */
const convertDuration = (raw: unknown): IMeasurement => {
  if (!isPlainObject(raw)) {
    throw new TypesetterError(
      'duration',
      'duration $value must be an object { value, unit }',
    );
  }
  const { value, unit } = raw as Partial<DurationValue>;
  const numeric = ensureFinite(value, 'duration', 'duration value');
  if (unit !== 'ms' && unit !== 's') {
    throw new TypesetterError(
      'duration',
      `duration unit must be "ms" or "s" (got ${String(unit)})`,
    );
  }
  return m(numeric, unit);
};

/**
 * DTCG `number` -> the most-constrained-accurate scalar: `i(n)` when the value
 * is an integer, else `f(n)`. The result is tagged so the caller knows which.
 */
const convertNumber = (
  raw: unknown,
):
  | { kind: 'integer'; value: IInteger }
  | {
      kind: 'float';
      value: IFloat;
    } => {
  const numeric = ensureFinite(raw, 'number', 'number $value');
  return Number.isInteger(numeric)
    ? { kind: 'integer', value: i(numeric) }
    : { kind: 'float', value: f(numeric) };
};

/**
 * DTCG `fontWeight` -> a keyword passes through; a number is hardened into the
 * constrained [1, 1000] integer (the constrained `fontWeight()` helper).
 */
const convertFontWeight = (
  raw: unknown,
):
  | { kind: 'fontWeight'; value: IInteger }
  | { kind: 'keyword'; value: FontWeightKeyword } => {
  if (typeof raw === 'string') {
    if (!FONT_WEIGHT_KEYWORDS.has(raw)) {
      throw new TypesetterError(
        'fontWeight',
        `unknown fontWeight keyword "${raw}"`,
      );
    }
    return { kind: 'keyword', value: raw as FontWeightKeyword };
  }
  const numeric = ensureFinite(
    raw,
    'fontWeight',
    'fontWeight $value',
  );
  if (!Number.isInteger(numeric)) {
    throw new TypesetterError(
      'fontWeight',
      `numeric fontWeight must be an integer (got ${numeric})`,
    );
  }
  if (numeric < 1 || numeric > 1000) {
    throw new TypesetterError(
      'fontWeight',
      `numeric fontWeight must be in [1, 1000] (got ${numeric})`,
    );
  }
  return { kind: 'fontWeight', value: fontWeight(numeric) };
};

/* ---------- color ---------- */

// DTCG colorSpaces that map 1:1 onto a calipers structured `ColorObject` space
// (exact, no string round-trip). Wide-gamut/xyz spaces below build a CSS
// color-function string for culori to parse instead.
const NATIVE_COLOR_SPACES: ReadonlySet<string> = new Set([
  'srgb',
  'hsl',
  'hwb',
  'lab',
  'lch',
  'oklab',
  'oklch',
]);

/** CSS `color()`-function gamut keyword per DTCG colorSpace (wide-gamut path). */
const CSS_COLOR_FUNCTION_SPACE: Partial<
  Record<DtcgColorSpace, string>
> = {
  'srgb-linear': 'srgb-linear',
  'display-p3': 'display-p3',
  'a98-rgb': 'a98-rgb',
  'prophoto-rgb': 'prophoto-rgb',
  rec2020: 'rec2020',
  'xyz-d65': 'xyz-d65',
  'xyz-d50': 'xyz-d50',
};

const componentAt = (
  components: readonly number[],
  index: number,
  space: DtcgColorSpace,
): number => {
  const value = components[index];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypesetterError(
      'color',
      `color components[${index}] for "${space}" must be a finite number`,
    );
  }
  return value;
};

/** Map a DTCG color value onto a calipers structured `ColorObject`. */
const toColorObject = (
  space: DtcgColorSpace,
  components: readonly number[],
  alpha: number | undefined,
): ColorObject => {
  const c = (index: number): number =>
    componentAt(components, index, space);
  switch (space) {
    // DTCG srgb components are 0..1; calipers rgb expects 0..255.
    case 'srgb':
      return {
        space: 'rgb',
        r: c(0) * 255,
        g: c(1) * 255,
        b: c(2) * 255,
        alpha,
      };
    // hue in degrees; saturation/lightness 0..100 (matches calipers).
    case 'hsl':
      return { space: 'hsl', h: c(0), s: c(1), l: c(2), alpha };
    case 'hwb':
      return { space: 'hwb', h: c(0), w: c(1), b: c(2), alpha };
    // lab/lch/oklab/oklch components are 1:1 with calipers.
    case 'lab':
      return { space: 'lab', l: c(0), a: c(1), b: c(2), alpha };
    case 'lch':
      return { space: 'lch', l: c(0), c: c(1), h: c(2), alpha };
    case 'oklab':
      return { space: 'oklab', l: c(0), a: c(1), b: c(2), alpha };
    case 'oklch':
      return { space: 'oklch', l: c(0), c: c(1), h: c(2), alpha };
    default:
      // Unreachable: only NATIVE_COLOR_SPACES reach here.
      throw new TypesetterError(
        'color',
        `"${space}" has no native calipers color space`,
      );
  }
};

/** Build a CSS `color(<gamut> r g b [/ a])` string for a wide-gamut space. */
const toCssColorFunction = (
  space: DtcgColorSpace,
  gamut: string,
  components: readonly number[],
  alpha: number | undefined,
): string => {
  const channels = components
    .map((_, index) => componentAt(components, index, space))
    .join(' ');
  const alphaSuffix = alpha === undefined ? '' : ` / ${alpha}`;
  return `color(${gamut} ${channels}${alphaSuffix})`;
};

/** DTCG `color` -> calipers `color(...)`, accurate to the source colorSpace. */
const convertColor = (raw: unknown): ResolvedColor => {
  if (!isPlainObject(raw)) {
    throw new TypesetterError(
      'color',
      'color $value must be an object { colorSpace, components }',
    );
  }
  const { colorSpace, components, alpha } =
    raw as Partial<ColorValue>;
  if (typeof colorSpace !== 'string') {
    throw new TypesetterError(
      'color',
      'color $value.colorSpace must be a string',
    );
  }
  if (!Array.isArray(components)) {
    throw new TypesetterError(
      'color',
      'color $value.components must be an array',
    );
  }
  if (alpha !== undefined) {
    ensureFinite(alpha, 'color', 'color $value.alpha');
  }
  const space = colorSpace;

  if (NATIVE_COLOR_SPACES.has(space)) {
    return color(toColorObject(space, components, alpha));
  }
  const gamut = CSS_COLOR_FUNCTION_SPACE[space];
  if (gamut !== undefined) {
    return color(toCssColorFunction(space, gamut, components, alpha));
  }
  throw new TypesetterError(
    'color',
    `unknown DTCG colorSpace "${colorSpace}"`,
  );
};

/* ----------------------------------------------------------------------------
 * THE decision function.
 * -------------------------------------------------------------------------- */

/**
 * Convert ONE DTCG token (with a resolved `$type`) into the most-constrained-yet
 * -accurate calipers primitive.
 *
 * - `dimension` -> `m(value, unit)` (px | rem)
 * - `duration`  -> `m(value, unit)` (ms | s; a time measurement)
 * - `number`    -> `i(n)` if integer, else `f(n)`
 * - `color`     -> `color(...)`
 * - `fontWeight`-> constrained [1, 1000] integer, or a keyword passthrough
 * - every composite / remaining primitive -> an explicit `{ unsupported }`
 *   deferral (the TBD workflow), never a silent wrong conversion.
 *
 * Malformed SUPPORTED tokens throw a typed {@link TypesetterError}.
 */
export const convertToken = (token: DtcgToken): ConvertResult => {
  if (!isPlainObject(token) || !('$type' in token)) {
    throw new TypesetterError(
      // a token with no resolvable $type is the parser's job, not ours.
      undefined,
      'token must be an object with a resolved "$type"',
    );
  }
  const type = token.$type;
  const raw: unknown = (token as { $value?: unknown }).$value;

  switch (type) {
    case 'dimension':
      return {
        kind: 'measurement',
        type,
        value: convertDimension(raw),
      };
    case 'duration':
      return {
        kind: 'measurement',
        type,
        value: convertDuration(raw),
      };
    case 'number': {
      const result = convertNumber(raw);
      return result.kind === 'integer'
        ? { kind: 'integer', type, value: result.value }
        : { kind: 'float', type, value: result.value };
    }
    case 'fontWeight': {
      const result = convertFontWeight(raw);
      return result.kind === 'fontWeight'
        ? { kind: 'fontWeight', type, value: result.value }
        : { kind: 'keyword', type, value: result.value };
    }
    case 'color':
      return { kind: 'color', type, value: convertColor(raw) };
    default: {
      if (UNSUPPORTED_TYPE_SET.has(type)) {
        return {
          unsupported: true,
          type,
          reason: `DTCG "${type}" is a composite/unsupported type, deferred to the (TBD) typesetter composite workflow`,
        };
      }
      throw new TypesetterError(
        undefined,
        `unknown DTCG $type "${String(type)}"`,
      );
    }
  }
};
