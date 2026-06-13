/**
 * Wrapper helpers for chroma.js colors with OKLCH conversion
 * utilities.
 *
 * Chroma Color instances are mutable: calling mutator methods such as
 * `.alpha`, `.darken`, `.saturate`, etc. modifies the same object in
 * place. When a single color value (e.g. `colorVars.contrast`) is
 * shared across the codebase, those in-place mutations lead to
 * surprising side effects—for example, another part of the app
 * suddenly receives a transparent version of the "contrast" color.
 *
 * This module provides an immutable façade (`ColorWrapper`) that
 * clones the underlying color before applying any modification, so
 * every chained modifier works on an isolated copy. The original
 * chroma color remains unchanged until a caller explicitly invokes
 * `.css()` or `.value()`.
 *
 * We also piggyback on Culori to convert to/from OKLCH without giving
 * up the familiar chroma manipulation APIs. The `color` helper
 * exposes `toOKLCH`/`fromOKLCH` so gradients and other utilities can
 * opt into modern color spaces when needed while keeping sRGB
 * fallbacks.
 */
import type { DegMeasurement } from '@css-bookends/css-calipers';
import chroma, { type Color } from 'chroma-js';
import { converter, type Oklch, parse } from 'culori';

// Dev-time validation warnings are surfaced in non-release builds and stay quiet
// in production. (Inlined from the portfolio's runtime-env helper.)
const notRelease = (): boolean =>
  (globalThis as { process?: { env?: { NODE_ENV?: string } } })
    .process?.env?.NODE_ENV !== 'production';

export type { Color } from 'chroma-js';

type MixArgs = Parameters<Color['mix']>;

type CssOptions = {
  forceAlpha?: boolean;
  preferKeywordTransparent?: boolean;
};

export type ColorWrapper = {
  unsafeColor: Color;
  css: (options?: CssOptions) => string;
  alpha: {
    (): number;
    (value: number): ColorWrapper;
  };
  darken: (value?: number) => ColorWrapper;
  brighten: (value?: number) => ColorWrapper;
  lighten: (value?: number) => ColorWrapper;
  saturate: (value?: number) => ColorWrapper;
  desaturate: (value?: number) => ColorWrapper;
  hueShift: (value: DegMeasurement) => ColorWrapper;
  mix: (
    target: ColorInput,
    ratio?: number,
    mode?: MixArgs[2],
  ) => ColorWrapper;
  mixSolid: (
    target: ColorInput,
    ratio?: number,
    mode?: MixArgs[2],
  ) => ColorWrapper;
  blend: {
    multiply: (options?: BlendOptions) => ColorWrapper;
    screen: (options?: BlendOptions) => ColorWrapper;
  };
  clone: () => ColorWrapper;
  value: () => Color;
  solid: () => ColorWrapper;
};

type ColorInput = Color | ColorWrapper | string;
type BlendOptions = {
  ratio?: number;
  stripColor?: ColorInput;
};

export const isColorWrapper = (
  value: unknown,
): value is ColorWrapper =>
  typeof value === 'object' &&
  value !== null &&
  'unsafeColor' in value;

const toColor = (input: ColorInput): Color => {
  if (typeof input === 'string') {
    try {
      return chroma(input);
    } catch (raw) {
      const reason =
        raw instanceof Error && raw.message
          ? raw.message
          : String(raw);
      throw new Error(
        [
          `Failed to parse color string "${input}".`,
          'Supported formats include hex ("#ff00ff"), rgb("rgb(255, 0, 0)"), hsl,',
          'oklch, or any value accepted by chroma-js.',
          `Original error: ${reason}`,
        ].join(' '),
      );
    }
  }
  return isColorWrapper(input) ? input.unsafeColor : input;
};

const cloneColor = (source: Color): Color => chroma(source.css());

const clampRatio = (ratio?: number) =>
  ratio === undefined ? undefined : Math.max(0, Math.min(1, ratio));

const derive = (
  source: Color,
  modifier: (draft: Color) => Color,
): ColorWrapper => {
  const draft = cloneColor(source);
  const next = modifier(draft);
  return wrap(next);
};

type ChromaScale = ReturnType<typeof chroma.scale>;

const createScale = (stops: ColorInput[]): ChromaScale =>
  chroma.scale(stops.map((stop) => toColor(stop)));

export type CuloriOKLCH = Oklch;

const toCuloriOKLCH = converter('oklch');
const fromCuloriOKLCH = converter('rgb');

const colorToCuloriOklch = (
  input: ColorInput,
): CuloriOKLCH | undefined => {
  const base = toColor(input);
  const converted = toCuloriOKLCH(base.css()) as Oklch | null;
  if (!converted) {
    return undefined;
  }
  return {
    mode: 'oklch',
    l: converted.l,
    c: converted.c,
    h: converted.h,
    alpha: converted.alpha,
  };
};

const culoriOklchToWrapper = (value: CuloriOKLCH): ColorWrapper => {
  const converted = fromCuloriOKLCH(value);
  if (!converted || converted.mode !== 'rgb') {
    throw new Error('Unable to convert OKLCH color to sRGB');
  }
  const toChannel = (channel: number) =>
    Math.max(0, Math.min(255, channel * 255));
  const base = chroma
    .rgb(
      toChannel(converted.r),
      toChannel(converted.g),
      toChannel(converted.b),
    )
    .alpha(converted.alpha ?? 1);
  return wrap(base);
};

const culoriOklchFromCss = (value: string): ColorWrapper => {
  const trimmed = value.trim();
  const normalized = trimmed.startsWith('oklch')
    ? trimmed
    : `oklch(${trimmed})`;
  const parsed = parse(normalized);
  if (!parsed || parsed.mode !== 'oklch') {
    throw new Error(
      `Expected OKLCH color string, received "${value}"`,
    );
  }
  return culoriOklchToWrapper(parsed);
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const normalizeFraction = (value: number) =>
  clamp01(value > 1 ? value / 100 : value);
const normalizeHue = (value: number) => ((value % 360) + 360) % 360;
const normalizePercent = (value: number) => {
  const percent = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, percent));
};
const normalizeRgbChannel = (value: number) => {
  const absolute = value <= 1 ? value * 255 : value;
  return Math.max(0, Math.min(255, Math.round(absolute)));
};
const normalizeAlpha = (value?: number) =>
  value === undefined ? undefined : normalizeFraction(value);

const lerp = (start: number, end: number, t: number) =>
  start + (end - start) * t;

const normalizeModifier = (value?: number) => {
  if (value === undefined) return 1;
  if (Number.isNaN(value)) return 1;
  const sign = Math.sign(value) || 1;
  const magnitude = Math.abs(value);
  const scaled =
    magnitude > 1
      ? magnitude <= 10
        ? magnitude / 10
        : magnitude / 100
      : magnitude;
  return sign * clamp01(scaled);
};

const formatHex = (value: string) => {
  const trimmed = value.trim();
  const bare = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  return `#${bare}`;
};

type OklchCreator = {
  (value: string): ColorWrapper;
  (l: number, c: number, h: number, alpha?: number): ColorWrapper;
};

type ColorCreators = {
  css: (value: string) => ColorWrapper;
  hex: (value: string) => ColorWrapper;
  rgba: (
    r: number,
    g: number,
    b: number,
    alpha?: number,
  ) => ColorWrapper;
  hsl: (
    h: number,
    s: number,
    l: number,
    alpha?: number,
  ) => ColorWrapper;
  oklch: OklchCreator;
};

const create: ColorCreators = {
  css: (value) => wrap(value),
  hex: (value) => wrap(formatHex(value)),
  rgba: (r, g, b, alpha) => {
    const R = normalizeRgbChannel(r);
    const G = normalizeRgbChannel(g);
    const B = normalizeRgbChannel(b);
    const A = normalizeAlpha(alpha);
    if (A === undefined) {
      return wrap(`rgb(${R}, ${G}, ${B})`);
    }
    return wrap(`rgba(${R}, ${G}, ${B}, ${Number(A.toFixed(3))})`);
  },
  hsl: (h, s, l, alpha) => {
    const H = normalizeHue(h);
    const S = normalizePercent(s);
    const L = normalizePercent(l);
    const A = normalizeAlpha(alpha);
    if (A === undefined) {
      return wrap(`hsl(${H}, ${S}%, ${L}%)`);
    }
    return wrap(`hsla(${H}, ${S}%, ${L}%, ${Number(A.toFixed(3))})`);
  },
  oklch: (
    first: number | string,
    c?: number,
    h?: number,
    alpha?: number,
  ) => {
    if (typeof first === 'string') {
      return culoriOklchFromCss(first);
    }
    if (c === undefined || h === undefined) {
      throw new Error(
        'color.create.oklch requires l, c, and h values when not using a CSS string',
      );
    }
    const normalized: CuloriOKLCH = {
      mode: 'oklch',
      l: normalizeFraction(first),
      c,
      h,
      alpha: normalizeAlpha(alpha) ?? 1,
    };
    return culoriOklchToWrapper(normalized);
  },
};

const toRgbChannel = (channel: number) =>
  Math.round(Math.max(0, Math.min(255, channel)));

const formatRgba = (value: Color): string => {
  const [
    r,
    g,
    b,
  ] = value.rgb(false);
  const alpha = value.alpha();
  const formattedAlpha =
    alpha === 1 ? '1' : Number(alpha.toFixed(3)).toString();
  return `rgba(${toRgbChannel(r)}, ${toRgbChannel(g)}, ${toRgbChannel(b)}, ${formattedAlpha})`;
};

const isInGamut = (oklch: CuloriOKLCH) => {
  const converted = fromCuloriOKLCH(oklch);
  if (!converted || converted.mode !== 'rgb') return false;
  return (
    converted.r >= 0 &&
    converted.r <= 1 &&
    converted.g >= 0 &&
    converted.g <= 1 &&
    converted.b >= 0 &&
    converted.b <= 1
  );
};

const maxChromaFor = (l: number, h: number, alpha?: number) => {
  let low = 0;
  let high = 0.4;
  const inGamut = (c: number) =>
    isInGamut({ mode: 'oklch', l, c, h, alpha });

  while (high < 2 && inGamut(high)) {
    low = high;
    high *= 2;
  }

  for (let i = 0; i < 24; i += 1) {
    const mid = (low + high) / 2;
    if (inGamut(mid)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return low;
};

const resolveDegrees = (value: DegMeasurement) => {
  const raw = value.getValue();
  if (raw == null || Number.isNaN(raw)) {
    if (notRelease()) {
      throw new Error('Expected a css-calipers degree measurement.');
    }
    return 0;
  }
  return normalizeHue(raw);
};

export function wrap(input: ColorInput): ColorWrapper {
  const createSymbolicColor = (label: string): ColorWrapper => {
    const err = (fn: string) => {
      const msg = `Cannot modify symbolic color '${label}' via ${fn}().`;
      if (notRelease()) throw new Error(msg);
      console.warn(msg);
      return symbolic;
    };

    const symbolic: ColorWrapper = {
      unsafeColor: chroma('black'),
      css: () => label,
      alpha: ((value?: number) => {
        if (value === undefined) return 1;
        return err('alpha');
      }) as ColorWrapper['alpha'],
      darken: () => err('darken'),
      brighten: () => err('brighten'),
      lighten: () => err('lighten'),
      saturate: () => err('saturate'),
      desaturate: () => err('desaturate'),
      hueShift: () => err('hueShift'),
      mix: () => err('mix'),
      mixSolid: () => err('mixSolid'),
      blend: {
        multiply: () => err('blend.multiply'),
        screen: () => err('blend.screen'),
      },
      clone: () => symbolic,
      value: () => chroma('black'),
      solid: () => symbolic,
    };
    return symbolic;
  };

  // ---- special symbolic case ----
  if (input === 'currentColor') {
    return createSymbolicColor('currentColor');
  }

  if (
    typeof input === 'string' &&
    input.trim().toLowerCase() === 'highlight'
  ) {
    return createSymbolicColor('Highlight');
  }

  // ---- regular flow ----
  const base = toColor(input);
  const alpha = ((value?: number) => {
    if (value === undefined) {
      return base.alpha();
    }
    return derive(base, (draft) => draft.alpha(value));
  }) as ColorWrapper['alpha'];

  const adjustOklch = (
    adjuster: (oklch: CuloriOKLCH) => CuloriOKLCH,
  ): ColorWrapper => {
    const oklch = colorToCuloriOklch(base);
    if (!oklch) {
      return wrap(base);
    }
    return culoriOklchToWrapper(adjuster(oklch));
  };

  const lightenBy = (value?: number) => {
    const delta = normalizeModifier(value);
    const fade = Math.abs(delta);
    return adjustOklch((oklch) => ({
      ...oklch,
      l:
        delta >= 0
          ? lerp(oklch.l, 1, delta)
          : lerp(oklch.l, 0, Math.abs(delta)),
      c: lerp(oklch.c, 0, fade),
    }));
  };

  const saturateBy = (value?: number) => {
    const delta = normalizeModifier(value);
    return adjustOklch((oklch) => ({
      ...oklch,
      c:
        delta >= 0
          ? lerp(
              oklch.c,
              maxChromaFor(oklch.l, oklch.h ?? 0, oklch.alpha ?? 1),
              delta,
            )
          : lerp(oklch.c, 0, Math.abs(delta)),
    }));
  };

  const blendWith = (
    mode: 'multiply' | 'screen',
    options?: BlendOptions,
  ): ColorWrapper => {
    const fallback = mode === 'multiply' ? '#ffffff' : '#000000';
    const targetColor = toColor(options?.stripColor ?? fallback);
    const [
      r,
      g,
      b,
    ] = cloneColor(base).rgb(false);
    const [
      tr,
      tg,
      tb,
    ] = cloneColor(targetColor).rgb(false);
    const dr = r - tr;
    const dg = g - tg;
    const db = b - tb;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);
    const maxDistance = Math.sqrt(3 * 255 * 255);
    const ratioValue = clampRatio(options?.ratio) ?? 1;
    const alphaFactor = lerp(1, distance / maxDistance, ratioValue);
    return wrap(cloneColor(base).alpha(base.alpha() * alphaFactor));
  };

  return {
    unsafeColor: base,
    css: (options?: CssOptions) => {
      const result = options?.forceAlpha
        ? formatRgba(base)
        : base.css();
      if (options?.preferKeywordTransparent && base.alpha() === 0)
        return 'transparent';
      return result;
    },
    alpha,
    darken: (value?: number) => lightenBy(-(value ?? 1)),
    brighten: (value?: number) => lightenBy(value),
    lighten: (value?: number) => lightenBy(value),
    saturate: (value?: number) => saturateBy(value),
    desaturate: (value?: number) => saturateBy(-(value ?? 1)),
    hueShift: (value: DegMeasurement) => {
      const delta = resolveDegrees(value);
      const oklch = colorToCuloriOklch(base);
      if (oklch) {
        const baseHue = oklch.h ?? 0;
        return culoriOklchToWrapper({
          ...oklch,
          h: normalizeHue(baseHue + delta),
          alpha: oklch.alpha ?? base.alpha(),
        });
      }
      return derive(base, (draft) => {
        const [
          hue,
        ] = draft.hsl();
        const safeHue = Number.isFinite(hue) ? hue : 0;
        const nextHue = normalizeHue(safeHue + delta);
        const nextAlpha = draft.alpha();
        return draft.set('hsl.h', nextHue).alpha(nextAlpha);
      });
    },
    mix: (target: ColorInput, ratio?: number, mode?: MixArgs[2]) =>
      derive(base, (draft) =>
        draft.mix(toColor(target), clampRatio(ratio), mode),
      ),
    mixSolid: (
      target: ColorInput,
      ratio?: number,
      mode?: MixArgs[2],
    ) =>
      derive(base, (draft) =>
        draft.alpha(1).mix(toColor(target), clampRatio(ratio), mode),
      ),
    blend: {
      multiply: (options?: BlendOptions) =>
        blendWith('multiply', options),
      screen: (options?: BlendOptions) =>
        blendWith('screen', options),
    },
    clone: () => wrap(cloneColor(base)),
    value: () => cloneColor(base),
    solid: () => derive(base, (draft) => draft.alpha(1)),
  };
}

export const color = Object.assign(
  (input: ColorInput) => wrap(input),
  {
    wrap,
    from: wrap,
    unsafeChroma: chroma,
    unsafeToColor: toColor,
    toOKLCH: (input: ColorInput) => colorToCuloriOklch(input),
    fromOKLCH: (value: CuloriOKLCH) => culoriOklchToWrapper(value),
    oklch: (value: CuloriOKLCH) => culoriOklchToWrapper(value),
    create,
    scale: (stops: ColorInput[]): ChromaScale => createScale(stops),
    lch: (l: number, c: number, h: number) =>
      wrap(chroma.lch(l, c, h)),
    fromCss: (value: string) => wrap(value),
  },
);

export type OKLCH = {
  l: number;
  c: number;
  h: number;
  a?: number;
};

export type ColorInputWithOKLCH = OKLCH | string | ColorWrapper;

export const isOKLCH = (value: unknown): value is OKLCH =>
  typeof value === 'object' &&
  value != null &&
  'l' in value &&
  'c' in value &&
  'h' in value;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const fmtOKLCH = ({ l, c, h, a }: OKLCH): string => {
  const L = `${clamp(l, 0, 100).toFixed(3)}%`;
  const C = clamp(c, 0, 0.4).toFixed(4);
  const H = ((h % 360) + 360) % 360;
  const A = a == null ? '' : ` / ${clamp(a, 0, 1)}`;
  return `oklch(${L} ${C} ${H}${A})`;
};

export const oklchToRgbString = ({ l, c, h, a }: OKLCH): string => {
  const normalized: CuloriOKLCH = {
    mode: 'oklch',
    l: clamp(l, 0, 100) / 100,
    c: clamp(c, 0, 0.4),
    h: ((h % 360) + 360) % 360,
    alpha: a ?? 1,
  };
  return color.fromOKLCH(normalized).css();
};

export const toModernOKLCH = (
  input: ColorInputWithOKLCH,
): OKLCH | undefined => {
  if (isOKLCH(input)) return input;
  const culori = color.toOKLCH(input);
  if (!culori) return undefined;
  return {
    l: culori.l * 100,
    c: culori.c,
    h: culori.h ?? 0,
    a: culori.alpha,
  };
};

export const colorFallback = (input: ColorInputWithOKLCH): string => {
  if (isColorWrapper(input)) return input.css();
  if (isOKLCH(input)) return oklchToRgbString(input);
  return input;
};

export const colorModern = (input: ColorInputWithOKLCH): string => {
  const oklch = toModernOKLCH(input);
  if (oklch) return fmtOKLCH(oklch);
  return colorFallback(input);
};

export const mixWithAlpha = (
  base: ColorWrapper,
  target: ColorInput,
  ratio: number,
  alpha?: number,
): ColorWrapper => {
  const desiredAlpha = alpha ?? base.alpha();
  return base.mixSolid(target, ratio).alpha(desiredAlpha);
};
