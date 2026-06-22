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
 * A CSS color string hardened to the format that produced it. A specific format
 * selector (`color(x).hex()`) yields a value typed `ColorString<'hex'>`, so "this is
 * a hex color" survives in the type, not just at runtime. Stays assignable to a plain
 * `CssColor`.
 */
export type ColorString<F extends string = string> = CssColor & {
  readonly __colorFormat: F;
};

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

/** How a fully-transparent color (alpha 0) is rendered. */
export type TransparentRendering = 'keyword' | 'white' | 'black';

/** The color book's config (factory-settable via `publishBookColor`). */
export interface ColorConfig {
  /**
   * What `.css()` renders with no argument: a single format, or a priority list that
   * escalates to the first format faithfully holding the color (simplest first).
   */
  output: CssFormat | CssFormat[];
  /** how violations are surfaced (strict by default; relaxed only in production). */
  strictness: Strictness;
  /**
   * How a fully-transparent color (alpha 0) renders: the `transparent` keyword,
   * white at 0, or black at 0.
   */
  transparent: TransparentRendering;
  /**
   * Drop the alpha slot when the color is fully opaque (alpha 1) for formats whose
   * alpha is optional (e.g. `rgba(...,1)` -> `rgb(...)`). Lossless. Off by default.
   */
  omitOpaqueAlpha: boolean;
}

/**
 * The resolved color: render via `.css()`, or pick a format. The selectors set the
 * format and return a new result; you still finish with `.css()`. Rendering only
 * ever happens through `.css()`.
 */
export interface ResolvedColor<F extends FormatName = FormatName> {
  /** the single render terminal. With no argument, a `ColorString<F>` in this result's
   * configured format; with a one-off `format`, a `ColorString` hardened to THAT
   * format (e.g. `color(x).css(colorFormats.hex)` is `ColorString<'hex'>`). */
  css(): ColorString<F>;
  css<G extends FormatName>(format: { format: G }): ColorString<G>;
  rgba(): ResolvedColor<'rgba'>;
  rgb(): ResolvedColor<'rgb'>;
  hex(): ResolvedColor<'hex'>;
  hexAlpha(): ResolvedColor<'hexAlpha'>;
  hsl(): ResolvedColor<'hsl'>;
  hwb(): ResolvedColor<'hwb'>;
  lab(): ResolvedColor<'lab'>;
  lch(): ResolvedColor<'lch'>;
  oklab(): ResolvedColor<'oklab'>;
  oklch(): ResolvedColor<'oklch'>;
  displayP3(): ResolvedColor<'displayP3'>;

  /* modifications: immutable - each returns a NEW resolved color in the SAME format
   * (the configured output threads through). Amounts are 0..1 fractions, in OKLCH. */
  alpha: {
    (): number;
    (value: number): ResolvedColor<F>;
  };
  darken(amount?: number): ResolvedColor<F>;
  lighten(amount?: number): ResolvedColor<F>;
  brighten(amount?: number): ResolvedColor<F>;
  saturate(amount?: number): ResolvedColor<F>;
  desaturate(amount?: number): ResolvedColor<F>;
  hueShift(value: DegMeasurement): ResolvedColor<F>;
  mix(
    target: ColorInput,
    ratio?: number,
    mode?: ColorSpace,
  ): ResolvedColor<F>;
  mixSolid(
    target: ColorInput,
    ratio?: number,
    mode?: ColorSpace,
  ): ResolvedColor<F>;
  mixWithAlpha(
    target: ColorInput,
    ratio?: number,
    alpha?: number,
    mode?: ColorSpace,
  ): ResolvedColor<F>;
  solid(): ResolvedColor<F>;
  clone(): ResolvedColor<F>;
}
