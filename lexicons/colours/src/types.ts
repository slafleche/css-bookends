import type { DegMeasurement } from '@css-bookends/css-calipers';
import type { Property } from 'csstype';
import type { Color } from 'culori';

/**
 * The color book's TYPE contract: the live, library-agnostic surface for the
 * input + storage layers. Runtime lives in `./color.ts`, which re-exports these.
 *
 * The backing library (culori) is referenced only by the internal `Store.color`
 * shape; the author-facing types (`ColorInput`, `ColorObject`, `Symbolic*`) never
 * name it.
 */

/* ---------- structured object input (one per color space; `alpha` everywhere) ---------- */

export type ColorObject =
  | { space: 'rgb'; r: number; g: number; b: number; alpha?: number }
  | { space: 'hsl'; h: number; s: number; l: number; alpha?: number }
  | { space: 'hwb'; h: number; w: number; b: number; alpha?: number }
  | { space: 'lab'; l: number; a: number; b: number; alpha?: number }
  | { space: 'lch'; l: number; c: number; h: number; alpha?: number }
  | {
      space: 'oklab';
      l: number;
      a: number;
      b: number;
      alpha?: number;
    }
  | {
      space: 'oklch';
      l: number;
      c: number;
      h: number;
      alpha?: number;
    };

/** The color-space discriminants (`'rgb' | 'hsl' | ...`). */
export type ColorSpace = ColorObject['space'];

/* ---------- symbolic keywords (emit-only; no fixed value) ---------- */

export type CurrentColor = 'currentColor';

/** CSS Color 4 system colors (current). */
export type SystemColor =
  | 'Canvas'
  | 'CanvasText'
  | 'LinkText'
  | 'VisitedText'
  | 'ActiveText'
  | 'ButtonFace'
  | 'ButtonText'
  | 'ButtonBorder'
  | 'Field'
  | 'FieldText'
  | 'Highlight'
  | 'HighlightText'
  | 'SelectedItem'
  | 'SelectedItemText'
  | 'Mark'
  | 'MarkText'
  | 'GrayText'
  | 'AccentColor'
  | 'AccentColorText';

/** Deprecated system colors (Appendix A): valid values, accepted as passthrough. */
export type DeprecatedSystemColor =
  | 'ActiveBorder'
  | 'ActiveCaption'
  | 'AppWorkspace'
  | 'Background'
  | 'ButtonHighlight'
  | 'ButtonShadow'
  | 'CaptionText'
  | 'InactiveBorder'
  | 'InactiveCaption'
  | 'InactiveCaptionText'
  | 'InfoBackground'
  | 'InfoText'
  | 'Menu'
  | 'MenuText'
  | 'Scrollbar'
  | 'ThreeDDarkShadow'
  | 'ThreeDFace'
  | 'ThreeDHighlight'
  | 'ThreeDLightShadow'
  | 'ThreeDShadow'
  | 'Window'
  | 'WindowFrame'
  | 'WindowText';

/** CSS-wide cascade keywords: valid color values, accepted as passthrough. */
export type CascadeKeyword =
  | 'inherit'
  | 'initial'
  | 'unset'
  | 'revert'
  | 'revert-layer';

/** Any keyword with no fixed value (emit-only; modifying/converting it throws). */
export type SymbolicColor =
  | CurrentColor
  | SystemColor
  | DeprecatedSystemColor
  | CascadeKeyword;

/* ---------- the canonical store ---------- */

/**
 * The canonical store, shared by the input and storage steps.
 *
 * - `color` is a culori color object. It can be any mode after INPUT (parse), and
 *   is normalized to OKLCH after STORAGE. That OKLCH-only state is a runtime
 *   invariant (asserted by the storage tests), not encoded in the type: the engine
 *   ties input and storage to one `Store`, so `color` stays broad here.
 * - symbolic keywords carry no value and pass through untouched.
 */
export type Store =
  | { kind: 'color'; color: Color }
  | { kind: 'symbolic'; keyword: SymbolicColor };

/* ---------- author-facing input ---------- */

/**
 * What a color may be created from: a CSS string, a structured `ColorObject`, or an
 * existing `ResolvedColor` (re-wrap). All library-agnostic - culori is never named.
 */
export type ColorInput = string | ColorObject | ResolvedColor;

/* ============================================================================
 * OUTPUT (Part 3 of the book): formats, config, and the resolved result.
 * ==========================================================================*/

/** A CSS color value string. The `.css()` terminal returns this (csstype-typed). */
export type CssColor = Property.Color;

/**
 * The output formats. Every alpha-capable format always renders its alpha slot;
 * `rgb` / `hex` (hex6) carry no alpha and warn if they would drop a non-opaque one.
 */
export type CssFormat =
  | { format: 'rgba' }
  | { format: 'rgb' }
  | { format: 'hex' }
  | { format: 'hexAlpha' }
  | { format: 'hsl' }
  | { format: 'hwb' }
  | { format: 'lab' }
  | { format: 'lch' }
  | { format: 'oklab' }
  | { format: 'oklch' }
  | { format: 'displayP3' };

/** The format discriminants (`'rgba' | 'hex' | ...`). */
export type FormatName = CssFormat['format'];

/**
 * How a "can't faithfully represent this" violation is surfaced: dropping a real
 * alpha, out-of-gamut, or modifying a symbolic color. `auto` = throw in dev / warn
 * in prod.
 */
export type Strictness = 'auto' | 'throw' | 'warn' | 'silent';

/** The color book's config (factory-settable via `publishBookColor`). */
export interface ColorConfig {
  /** the format `.css()` renders when given no argument. */
  output: CssFormat;
  /** the color a bare call (no input) resolves to. */
  base: ColorInput;
  /** how violations are surfaced. */
  strictness: Strictness;
}

/**
 * The resolved color: render via `.css()`, or pick a format. The selectors set the
 * format and return a new result; you still finish with `.css()`. Rendering only
 * ever happens through `.css()`.
 */
export interface ResolvedColor {
  /** the single render terminal: a CSS color string in the configured format, or in
   * `format` for a one-off. */
  css(format?: CssFormat): CssColor;
  rgba(): ResolvedColor;
  rgb(): ResolvedColor;
  hex(): ResolvedColor;
  hexAlpha(): ResolvedColor;
  hsl(): ResolvedColor;
  hwb(): ResolvedColor;
  lab(): ResolvedColor;
  lch(): ResolvedColor;
  oklab(): ResolvedColor;
  oklch(): ResolvedColor;
  displayP3(): ResolvedColor;

  /* modifications: immutable - each returns a NEW resolved color. Amounts are
   * 0..1 fractions, relative (toward the extreme); they operate in OKLCH. */
  alpha: {
    (): number;
    (value: number): ResolvedColor;
  };
  darken(amount?: number): ResolvedColor;
  lighten(amount?: number): ResolvedColor;
  brighten(amount?: number): ResolvedColor;
  saturate(amount?: number): ResolvedColor;
  desaturate(amount?: number): ResolvedColor;
  hueShift(value: DegMeasurement): ResolvedColor;
  mix(
    target: ColorInput,
    ratio?: number,
    mode?: ColorSpace,
  ): ResolvedColor;
  mixSolid(
    target: ColorInput,
    ratio?: number,
    mode?: ColorSpace,
  ): ResolvedColor;
  mixWithAlpha(
    target: ColorInput,
    ratio?: number,
    alpha?: number,
    mode?: ColorSpace,
  ): ResolvedColor;
  solid(): ResolvedColor;
  clone(): ResolvedColor;
}
