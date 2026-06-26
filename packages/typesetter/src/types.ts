// The DTCG (Design Tokens Format Module, 2025.10) token shapes the typesetter
// reads, plus the result/error types `convertToken` returns. These describe the
// INPUT boundary only; the OUTPUT is a calipers primitive (`IMeasurement`,
// `IInteger`, `IFloat`, `ResolvedColor`) or the documented unsupported sentinel.
//
// Reference: https://www.designtokens.org/tr/drafts/format/ (+ the Color module
// at https://www.designtokens.org/tr/drafts/color/).

/* ----------------------------------------------------------------------------
 * The DTCG $type space, in full. Every predefined type is named here so the
 * converter's decision table can be exhaustive (no $type silently unhandled).
 * -------------------------------------------------------------------------- */

/** The five DTCG primitive types the typesetter converts to a calipers value. */
export type SupportedTokenType =
  | 'color'
  | 'dimension'
  | 'number'
  | 'fontWeight'
  | 'duration';

/**
 * The DTCG types the typesetter explicitly DEFERS (the TBD workflow): the
 * remaining primitives and every composite. They are not silently mis-converted;
 * `convertToken` rejects them with a clear, typed deferral.
 */
export type UnsupportedTokenType =
  | 'fontFamily'
  | 'cubicBezier'
  | 'strokeStyle'
  | 'border'
  | 'transition'
  | 'shadow'
  | 'gradient'
  | 'typography';

/** Every predefined DTCG `$type`. */
export type DtcgTokenType = SupportedTokenType | UnsupportedTokenType;

/* ----------------------------------------------------------------------------
 * Per-type $value shapes (the supported five). These are the value shapes the
 * converter reads; composite value shapes are intentionally left as `unknown`
 * because the converter never reads them (it defers first).
 * -------------------------------------------------------------------------- */

/** DTCG dimension unit: `px` or `rem` (Format Module 2025.10). */
export type DimensionUnit = 'px' | 'rem';

/** DTCG dimension `$value`: magnitude split from unit. */
export interface DimensionValue {
  value: number;
  unit: DimensionUnit;
}

/** DTCG duration unit: `ms` or `s`. */
export type DurationUnit = 'ms' | 's';

/** DTCG duration `$value`: magnitude split from unit (a time measurement). */
export interface DurationValue {
  value: number;
  unit: DurationUnit;
}

/** DTCG color-module colorSpace identifiers (Color module 2025.10). */
export type DtcgColorSpace =
  | 'srgb'
  | 'srgb-linear'
  | 'hsl'
  | 'hwb'
  | 'lab'
  | 'lch'
  | 'oklab'
  | 'oklch'
  | 'display-p3'
  | 'a98-rgb'
  | 'prophoto-rgb'
  | 'rec2020'
  | 'xyz-d65'
  | 'xyz-d50';

/** DTCG color `$value`: a colorSpace, its components, optional alpha + hex. */
export interface ColorValue {
  colorSpace: DtcgColorSpace;
  components: readonly number[];
  alpha?: number;
  hex?: string;
}

/**
 * DTCG fontWeight named aliases (Format Module 2025.10). A keyword passes
 * through verbatim; a number is hardened into [1, 1000].
 */
export type FontWeightKeyword =
  | 'thin'
  | 'hairline'
  | 'extra-light'
  | 'ultra-light'
  | 'light'
  | 'normal'
  | 'regular'
  | 'book'
  | 'medium'
  | 'semi-bold'
  | 'demi-bold'
  | 'bold'
  | 'extra-bold'
  | 'ultra-bold'
  | 'black'
  | 'heavy'
  | 'extra-black'
  | 'ultra-black';

/* ----------------------------------------------------------------------------
 * The token envelope. A DTCG token is any object with a `$value`; `$type` may be
 * inherited from a parent group, so the typesetter requires it to be resolved
 * onto the token BEFORE conversion (this layer does no tree-walking).
 * -------------------------------------------------------------------------- */

/** Properties common to every DTCG token (metadata). */
export interface DtcgTokenMeta {
  $description?: string;
  $extensions?: Record<string, unknown>;
  $deprecated?: boolean | string;
}

/** A DTCG token with a resolved `$type` and its corresponding `$value` shape. */
export type DtcgToken =
  | (DtcgTokenMeta & { $type: 'color'; $value: ColorValue })
  | (DtcgTokenMeta & { $type: 'dimension'; $value: DimensionValue })
  | (DtcgTokenMeta & { $type: 'number'; $value: number })
  | (DtcgTokenMeta & {
      $type: 'fontWeight';
      $value: number | FontWeightKeyword;
    })
  | (DtcgTokenMeta & { $type: 'duration'; $value: DurationValue })
  | (DtcgTokenMeta & {
      $type: UnsupportedTokenType;
      $value: unknown;
    });

/* ----------------------------------------------------------------------------
 * The result of a conversion. `convertToken` either returns a primitive picked
 * by the decision table, or (for deferred types) returns the explicit
 * unsupported sentinel. Malformed supported tokens throw `TypesetterError`.
 * -------------------------------------------------------------------------- */

/** The calipers primitive kind a supported token converted to. */
export type ConvertedKind =
  | 'measurement'
  | 'integer'
  | 'float'
  | 'color'
  | 'fontWeight'
  | 'keyword';

/** The explicit, documented deferral sentinel for an unsupported `$type`. */
export interface UnsupportedResult {
  unsupported: true;
  type: UnsupportedTokenType;
  reason: string;
}
