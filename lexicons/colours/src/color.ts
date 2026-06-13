/**
 * color — the new color book. STEP 1: the input contract (types only).
 *
 * The guts are deliberately not here yet; this file defines what a color can be
 * MADE from. See `color-spaces.md` for the full surface. Rule: if it is a valid CSS
 * color value, it is accepted. Accepted values are either translatable (a concrete
 * point in a color space - manipulable + convertible) or symbolic (a keyword with no
 * fixed value - emit-only; modifying or converting it throws).
 */

/* ---------- symbolic keywords (emit-only; modifying/converting throws) ---------- */

/** The element's own `color`. */
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

/** Every symbolic color: a keyword with no fixed value (emit-only). */
export type SymbolicColor =
  | CurrentColor
  | SystemColor
  | DeprecatedSystemColor
  | CascadeKeyword;

/* ---------- translatable structured inputs (one per color space) ---------- */

/** A structured, translatable color: a concrete point in a named space. `alpha` is
 *  the optional opacity channel everywhere (never `a`). */
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

/* ---------- an already-resolved color (re-wrap) ---------- */

/**
 * The result type. Fully defined with the output step; here it is the minimum
 * needed so an existing color can be passed back in (re-wrap). It must expose
 * `.css()` (the engine's `Out extends { css(): unknown }` contract).
 */
export interface ResolvedColor {
  css(): string;
}

/* ---------- the input union ---------- */

/**
 * Anything a color can be MADE from:
 * - a CSS color string (named, hex, `rgb()/hsl()/hwb()/lab()/lch()/oklab()/oklch()`,
 *   `transparent`, plus the symbolic keywords above) — `string` covers them all;
 *   `SymbolicColor` is exported separately for recognition/typing,
 * - a structured `ColorObject` (one per space), or
 * - an existing `ResolvedColor` (re-wrap).
 */
export type ColorInput = string | ColorObject | ResolvedColor;
