import type { EvergreenConfig, PostProcessCore } from '../types';
import { lightningCore } from './lightningcss';

/**
 * A pre-step: a pure string transform applied to the CSS BEFORE the inner core runs.
 * It sees the same evergreen config the core will see, so a real pre-step could vary
 * its behaviour by targets, but it must not be the core: it never owns fallbacks,
 * prefixes, or minification. Tag it with an optional `preStepName` so a composed core
 * can name itself honestly.
 */
export interface PreStep {
  (css: string, evergreen: EvergreenConfig): string;
  /** a readable name for this pre-step, surfaced in the composed core's `name`. */
  preStepName?: string;
}

/**
 * Compose a core: wrap an inner `PostProcessCore` with one or more pre-steps, WITHOUT
 * replacing it (the onion principle). The returned core's `finish` runs each pre-step
 * over the CSS string in order, THEN hands the transformed CSS to `inner.finish` with
 * the same evergreen config and pass-through options. The inner core keeps doing 100%
 * of its job (fallbacks, prefixes, minification); the pre-steps are just a ring around
 * it.
 *
 * The `name` is honest about the composition, e.g. `compose(keyword-to-rgb,
 * lightningcss)`, so we never pass the wrapped tool off as ours.
 *
 * Defaults the inner core to the Lightning CSS core, matching the finisher default.
 */
export const composeCore = <Opts = unknown>(
  preSteps: PreStep | readonly PreStep[],
  inner: PostProcessCore<Opts> = lightningCore as unknown as PostProcessCore<Opts>,
): PostProcessCore<Opts> => {
  const steps: readonly PreStep[] =
    typeof preSteps === 'function'
      ? [
          preSteps,
        ]
      : preSteps;

  return {
    name: `compose(${steps.map((s) => s.preStepName ?? 'pre-step').join(', ')}, ${inner.name})`,
    finish(css, evergreen, options) {
      const transformed = steps.reduce(
        (acc, step) => step(acc, evergreen),
        css,
      );
      return inner.finish(transformed, evergreen, options);
    },
  };
};

/**
 * POC pre-step: a hard-coded keyword-to-rgb rewrite for the zoo-style keyword colour
 * outputs. It rewrites the colour keywords `pink`, `black`, and `white` as whole-token
 * values only, so it never corrupts unrelated text (e.g. a `pink` inside a class name
 * or a longer identifier). This is deliberately narrow and is NOT a general CSS colour
 * parser: it is just enough to demonstrate the seam.
 *
 * POC NOTE: the real version would read the createColor registry to resolve keywords to
 * their RGB values, rather than this hard-coded map.
 */
const KEYWORD_TO_RGB: Readonly<Record<string, string>> = {
  pink: 'rgb(255, 192, 203)',
  black: 'rgb(0, 0, 0)',
  white: 'rgb(255, 255, 255)',
};

export const keywordToRgb: PreStep = (css) => {
  // Whole-token match only: the keyword must not be adjacent to identifier characters
  // (so a `pink` inside a class name or a longer identifier is left untouched).
  const keywords = Object.keys(KEYWORD_TO_RGB).join('|');
  const pattern = new RegExp(
    `(^|[^0-9A-Za-z_-])(${keywords})(?![0-9A-Za-z_-])`,
    'g',
  );
  return css.replace(
    pattern,
    (_match, lead: string, kw: string) =>
      `${lead}${KEYWORD_TO_RGB[kw]}`,
  );
};
keywordToRgb.preStepName = 'keyword-to-rgb';

/**
 * The minimal shape gilding needs from the `createColor` registry: a record of
 * format-name -> descriptor, where a descriptor MAY carry a `fallback` browser-compat
 * transform. Typed STRUCTURALLY on purpose: gilding takes no hard dependency on
 * calipers, it just reads `.fallback` off whatever descriptors the registry holds.
 * This is the `CustomColor.formats` shape (calipers' `Record<string,
 * ColorSpaceDescriptor>`), seen through gilding's eyes.
 */
export interface FallbackBearingFormat {
  /** the format's registry key; used to name the derived pre-step honestly. */
  readonly format?: string;
  /** the optional browser-compat string->string transform (see calipers' plugin). */
  readonly fallback?: (css: string) => string;
}

/** A registry map: format-name -> descriptor, as `createColor(...).formats` returns. */
export type FormatRegistry = Readonly<
  Record<string, FallbackBearingFormat>
>;

/**
 * Registry-aware composing core (the un-hard-coded path). Instead of a baked-in
 * keyword map, this reads each registered custom format's OWN declared `fallback`
 * transform off the `createColor` registry, turns each into a `PreStep`, and composes
 * them (via the existing `composeCore`) in front of the inner Lightning CSS core. The
 * inner core stays fully intact (the onion); the registry's fallbacks are just a ring
 * around it.
 *
 * Reads the registry STRUCTURALLY (`Object.values(formats)`, pulling `.fallback`);
 * formats with no `fallback` contribute no pre-step. So adding a format WITH a fallback
 * to the registry is what causes the rewrite, proving it is registry-driven, not a
 * hard-coded map.
 *
 * POC NOTE: deliberately minimal, just enough to prove the seam. A production version
 * would likely de-duplicate, order, or guard the transforms more carefully.
 */
export const composeCoreFromFormats = <Opts = unknown>(
  formats: FormatRegistry,
  inner: PostProcessCore<Opts> = lightningCore as unknown as PostProcessCore<Opts>,
): PostProcessCore<Opts> => {
  const preSteps: PreStep[] = [];
  for (const descriptor of Object.values(formats)) {
    const transform = descriptor.fallback;
    if (transform === undefined) continue;
    // adapt the registry's plain string->string fallback into a PreStep (a pre-step
    // also receives the evergreen config, which a fallback does not need, so it is
    // simply ignored here).
    const step: PreStep = (css) => transform(css);
    step.preStepName = `registry-fallback(${descriptor.format ?? 'custom'})`;
    preSteps.push(step);
  }

  // No registered format declared a fallback: there is nothing to ring around the
  // inner core, so hand back the inner core untouched (the honest no-op composition).
  if (preSteps.length === 0) return inner;

  return composeCore(preSteps, inner);
};
