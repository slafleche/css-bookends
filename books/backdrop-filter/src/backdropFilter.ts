import type { ColorWrapper } from '@css-bookends/colours';
import type {
  IMeasurement,
  PercentMeasurement,
} from '@css-bookends/css-calipers';
import { createSupportsFallback } from '@css-bookends/supports-fallback';
import type * as CSS_TYPES from 'csstype';

/**
 * Composes backdrop-filter intents so styles always emit both
 * `backdropFilter` and `WebkitBackdropFilter` with identical values.
 * Accepts css-calipers measurements for blur + percent-driven filters
 * (`mPercent`) alongside simple numeric knobs (e.g. brightness
 * multipliers) so presets/helpers can stay declarative. Blur inputs
 * expect length-based measurements (px/rem/vh/etc.).
 */

type BlurInput = IMeasurement<string> | null | undefined;
type PercentInput = PercentMeasurement | null | undefined;
type BrightnessInput = PercentMeasurement | number | null | undefined;

export type BackdropFilterIntent = {
  blur?: BlurInput;
  saturate?: PercentInput;
  contrast?: PercentInput;
  brightness?: BrightnessInput;
  backgroundColor?: ColorWrapper;
};

const blurPart = (value: BlurInput): string | undefined =>
  value ? `blur(${value.css()})` : undefined;

const percentPart = (
  value: PercentInput,
  fn: 'saturate' | 'contrast',
): string | undefined =>
  value ? `${fn}(${value.css()})` : undefined;

const brightnessPart = (
  value: BrightnessInput,
): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return undefined;
    return `brightness(${value})`;
  }
  return `brightness(${value.css()})`;
};

const buildBackdropFilterParts = (
  intents: Array<BackdropFilterIntent | null | undefined>,
): string[] => {
  const parts: string[] = [];
  intents.forEach((intent) => {
    if (!intent) return;
    [
      blurPart(intent.blur),
      percentPart(intent.saturate, 'saturate'),
      percentPart(intent.contrast, 'contrast'),
      brightnessPart(intent.brightness),
    ].forEach((part) => {
      if (part) parts.push(part);
    });
  });
  return parts.filter(
    (part): part is string => !!part && part.trim().length > 0,
  );
};

const resolveBackdropBackgroundColor = (
  intents: Array<BackdropFilterIntent | null | undefined>,
): CSS_TYPES.Property.BackgroundColor | undefined => {
  let backgroundColor: CSS_TYPES.Property.BackgroundColor | undefined;
  intents.forEach((intent) => {
    if (!intent) return;
    if (intent.backgroundColor !== undefined) {
      backgroundColor = intent.backgroundColor.css();
    }
  });
  return backgroundColor;
};

export const backdropFilterValue = (
  ...intents: Array<BackdropFilterIntent | null | undefined>
): CSS_TYPES.Property.BackdropFilter | undefined => {
  const parts = buildBackdropFilterParts(intents);
  if (!parts.length) return undefined;
  return parts.join(' ');
};

export const backdropFilterStyle = (
  ...intents: Array<BackdropFilterIntent | null | undefined>
) => {
  const value = backdropFilterValue(...intents);
  const backgroundColor = resolveBackdropBackgroundColor(intents);
  const styles: {
    backdropFilter?: CSS_TYPES.Property.BackdropFilter;
    WebkitBackdropFilter?: CSS_TYPES.Property.BackdropFilter;
    backgroundColor?: CSS_TYPES.Property.BackgroundColor;
  } = {};
  if (value) {
    styles.backdropFilter = value;
    styles.WebkitBackdropFilter = value;
  }
  if (backgroundColor !== undefined) {
    styles.backgroundColor = backgroundColor;
  }
  return styles;
};

type BackdropFilterComposer = {
  (...intents: Array<BackdropFilterIntent | null | undefined>): {
    backdropFilter?: CSS_TYPES.Property.BackdropFilter;
    WebkitBackdropFilter?: CSS_TYPES.Property.BackdropFilter;
    backgroundColor?: CSS_TYPES.Property.BackgroundColor;
  };
  value: typeof backdropFilterValue;
  style: typeof backdropFilterStyle;
};

/**
 * Default export mirrors the ergonomics of `transforms.helper.ts`,
 * letting callers compose intents while still reaching for `.value` /
 * `.style` when needed.
 */
const backdropFilters = ((...intents) =>
  backdropFilterStyle(...intents)) as BackdropFilterComposer;

backdropFilters.value = backdropFilterValue;
backdropFilters.style = backdropFilterStyle;

export default backdropFilters;

const supportsBackdropQuery =
  '((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))';

/**
 * Emits a global @supports guard (via the shared fallback helper) so
 * we can provide backdrop-filter powered styles while keeping
 * deterministic fallbacks for browsers that lack support.
 *
 * Example usage:
 *
 *     registerBackdropFallback({
 *       selector: '.frostedCard',
 *       supported: backdropFilters.style({ blur: glassVars.blur }),
 *       fallback: { backgroundColor: glassVars.backupFill.css() },
 *     });
 */
export const registerBackdropFallback = createSupportsFallback(
  supportsBackdropQuery,
);
