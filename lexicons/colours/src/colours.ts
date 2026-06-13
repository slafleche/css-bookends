/**
 * colours as a book.
 *
 * colours is technically a lexicon (a primitive value type other books build on),
 * but it is stamped from the same `bookpress` press as a book so it gains the
 * three-page pipeline and multiple output formats. See `design.md`.
 *
 * This is pass 1: the press delegates entirely to the existing immutable
 * `ColorWrapper` in `./colorWrap` (kept as-is). The hybrid shows here:
 *   - input/storage/output is the book shell,
 *   - the chainable transform algebra on the resolved result is the lexicon half;
 *     each modification returns a NEW resolved colour (already how `ColorWrapper`
 *     behaves, so no new cost beyond a small adapter allocation).
 */
import { bookPress, type Press } from '@css-bookends/bookpress';
import type { DegMeasurement } from '@css-bookends/css-calipers';

import {
  color,
  colorModern,
  fmtOKLCH,
  toModernOKLCH,
  type Color,
  type ColorWrapper,
} from './colorWrap';

/* ---------- value types ---------- */

/** The shapes the existing `color()` helper accepts as a single argument. */
export type ColourInput = string | Color | ColorWrapper;

/**
 * The output format: a discriminated union keyed by `format`. Each variant
 * carries its own typed options, so there are no loose stringly-typed flags.
 */
export type CssFormat =
  | { format: 'css' }
  | { format: 'rgb'; legacy?: boolean } // legacy `rgba(…)` comma form vs modern `rgb(… / a)`
  | { format: 'hex'; alpha?: boolean } // `#rrggbbaa` vs `#rrggbb`
  | { format: 'hsl' }
  | { format: 'oklch' }
  | { format: 'modern' };

/** The discriminant values (format names). */
export type FormatName = CssFormat['format'];

/**
 * Named format presets. Prefer these over raw objects or strings, e.g.
 * `c.css(colorFormats.hex)` rather than `c.css({ format: 'hex' })`. Option
 * variants (legacy rgb, alpha hex) are named entries so you never hand-write
 * the options either.
 */
export const colorFormats = {
  css: { format: 'css' },
  rgb: { format: 'rgb' },
  rgbLegacy: { format: 'rgb', legacy: true },
  hex: { format: 'hex' },
  hexAlpha: { format: 'hex', alpha: true },
  hsl: { format: 'hsl' },
  oklch: { format: 'oklch' },
  modern: { format: 'modern' },
} as const satisfies Record<string, CssFormat>;

type MixMode = Parameters<ColorWrapper['mix']>[2];
type BlendOptions = Parameters<ColorWrapper['blend']['multiply']>[0];

/* ---------- factory config ---------- */

/** The book's defaults plus the default output format. */
export interface ColoursConfig {
  /** the format `.css()` renders when given no argument. */
  output: CssFormat;
  /** the colour a bare call (no input) resolves to. */
  base: ColourInput;
}

export const defaultColoursConfig: ColoursConfig = {
  output: colorFormats.css,
  base: 'black',
};

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a colours book: render in any supported format, or apply
 * a modification to get a new resolved colour.
 */
export interface ResolvedColour {
  /**
   * The single render terminal (page 3): a CSS string. Renders in the
   * configured format (`config.output`), or in `format` for a one-off.
   */
  css(format?: CssFormat): string;

  /*
   * format selectors -> a new resolved colour configured to emit that format.
   * These do NOT render; they set the format and you still finish with `.css()`
   * (e.g. `c.hex().css()`). Rendering only ever happens through `.css()`.
   */
  hex(options?: { alpha?: boolean }): ResolvedColour;
  rgb(options?: { legacy?: boolean }): ResolvedColour;
  hsl(): ResolvedColour;
  oklch(): ResolvedColour;
  modern(): ResolvedColour;

  /* modifications (the lexicon algebra) -> a new resolved colour */
  alpha: {
    (): number;
    (value: number): ResolvedColour;
  };
  darken(value?: number): ResolvedColour;
  brighten(value?: number): ResolvedColour;
  lighten(value?: number): ResolvedColour;
  saturate(value?: number): ResolvedColour;
  desaturate(value?: number): ResolvedColour;
  hueShift(value: DegMeasurement): ResolvedColour;
  mix(target: ColourInput, ratio?: number, mode?: MixMode): ResolvedColour;
  mixSolid(target: ColourInput, ratio?: number, mode?: MixMode): ResolvedColour;
  solid(): ResolvedColour;
  blend: {
    multiply(options?: BlendOptions): ResolvedColour;
    screen(options?: BlendOptions): ResolvedColour;
  };

  /** escape hatch to the underlying immutable wrapper. */
  wrapper(): ColorWrapper;
}

/* ---------- output (page 3): render one format ---------- */

const renderFormat = (store: ColorWrapper, fmt: CssFormat): string => {
  switch (fmt.format) {
    case 'hex':
      return store.unsafeColor.hex(fmt.alpha ? 'rgba' : 'rgb');
    case 'hsl':
      return store.unsafeColor.css('hsl');
    case 'oklch': {
      const oklch = toModernOKLCH(store);
      return oklch ? fmtOKLCH(oklch) : store.css();
    }
    case 'modern':
      return colorModern(store);
    case 'rgb':
      return store.css(fmt.legacy ? { forceAlpha: true } : undefined);
    case 'css':
    default:
      return store.css();
  }
};

/* ---------- the navigable result, delegating to the wrapper ---------- */

function resolve(store: ColorWrapper, cfg: ColoursConfig): ResolvedColour {
  const next = (w: ColorWrapper): ResolvedColour => resolve(w, cfg);
  // select a format: same colour, new configured output. Persists through
  // later modifications because each resolved colour captures its own cfg.
  const withFormat = (output: CssFormat): ResolvedColour =>
    resolve(store, { ...cfg, output });

  const alpha = ((value?: number) =>
    value === undefined ? store.alpha() : next(store.alpha(value))) as ResolvedColour['alpha'];

  return {
    css: (format?: CssFormat) => renderFormat(store, format ?? cfg.output),

    hex: (options?: { alpha?: boolean }) => withFormat({ format: 'hex', ...options }),
    rgb: (options?: { legacy?: boolean }) => withFormat({ format: 'rgb', ...options }),
    hsl: () => withFormat({ format: 'hsl' }),
    oklch: () => withFormat({ format: 'oklch' }),
    modern: () => withFormat({ format: 'modern' }),

    alpha,
    darken: (value?: number) => next(store.darken(value)),
    brighten: (value?: number) => next(store.brighten(value)),
    lighten: (value?: number) => next(store.lighten(value)),
    saturate: (value?: number) => next(store.saturate(value)),
    desaturate: (value?: number) => next(store.desaturate(value)),
    hueShift: (value: DegMeasurement) => next(store.hueShift(value)),
    mix: (target: ColourInput, ratio?: number, mode?: MixMode) =>
      next(store.mix(target, ratio, mode)),
    mixSolid: (target: ColourInput, ratio?: number, mode?: MixMode) =>
      next(store.mixSolid(target, ratio, mode)),
    solid: () => next(store.solid()),
    blend: {
      multiply: (options?: BlendOptions) => next(store.blend.multiply(options)),
      screen: (options?: BlendOptions) => next(store.blend.screen(options)),
    },

    wrapper: () => store,
  };
}

/* ---------- the press + the factory ---------- */

const coloursPress: Press<ColourInput, ColorWrapper, ResolvedColour, ColoursConfig> = {
  defaults: defaultColoursConfig,
  // page 1 — parse any colour expression into the canonical store (an immutable wrapper).
  input: (raw, cfg) => color(raw ?? cfg.base),
  // page 2 — the wrapper is already canonical.
  storage: (store) => store,
  // page 3 — one output returning the navigable result (formats live on it).
  outputs: { default: (store, cfg) => resolve(store, cfg) },
  default: 'default',
};

/** A colours book: callable bare (the configured base) or with a colour input. */
export type Colours = (input?: ColourInput) => ResolvedColour;

/**
 * bookPressColours: the colours factory. Give it defaults + default output format, get
 * a colours book. A bare call resolves the configured base colour.
 */
export function bookPressColours(config: Partial<ColoursConfig> = {}): Colours {
  return bookPress(coloursPress)({ config }) as Colours;
}
