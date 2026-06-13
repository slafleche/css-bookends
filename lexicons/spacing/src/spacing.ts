import { isMeasurement, m } from '@css-bookends/css-calipers';

import type {
  AxisValues,
  SpacingKeyword,
  SpacingValue,
} from './types';

const SPACING_KEYWORDS = new Set<SpacingKeyword>([
  'auto',
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
]);

const defaultSpacing = (): SpacingFourSides => ({
  top: m(0),
  right: m(0),
  bottom: m(0),
  left: m(0),
});

/**
 * Spacing intent (internal):
 *
 * - Prefer `all` when every side shares the same spacing.
 * - Prefer `vertical` when top/bottom are the same.
 * - Prefer `horizontal` when left/right are the same.
 * - Use explicit `top`/`right`/`bottom`/`left` only for asymmetrical
 *   cases.
 *
 * External callers should eventually rely on `SpacingIntent` (which
 * omits the internal `all` axis) plus value shorthands; helpers keep
 * this richer shape for their own resolution logic.
 */
export type SpacingIntentInternal = AxisValues<SpacingValue>;

export type SpacingIntent = {
  horizontal?: SpacingValue;
  vertical?: SpacingValue;
} & Partial<
  Record<'top' | 'right' | 'bottom' | 'left', SpacingValue>
>;

export type SpacingInput = SpacingIntentInternal | undefined;
export type SpacingInputPublic =
  | SpacingValue
  | SpacingIntent
  | undefined;
export type SpacingFourSides = {
  top: SpacingValue;
  right: SpacingValue;
  bottom: SpacingValue;
  left: SpacingValue;
};

const isSpacingKeyword = (value: unknown): value is SpacingKeyword =>
  typeof value === 'string' &&
  SPACING_KEYWORDS.has(value as SpacingKeyword);

const spacingToCss = (v: SpacingValue | 0): string => {
  if (v === 0) return m(0).css();
  if (isMeasurement(v)) return v.css();
  if (isSpacingKeyword(v)) return v;
  throw new Error(
    '[spacing] Expected a css-calipers measurement value or approved spacing keyword (auto, inherit, initial, unset, revert, revert-layer).',
  );
};

const resolve = (
  candidates: Array<SpacingValue | undefined>,
  fallback: SpacingValue,
): string => {
  for (const candidate of candidates) {
    if (candidate !== undefined) {
      return spacingToCss(candidate);
    }
  }
  return spacingToCss(fallback);
};

const normalize = (
  input?: SpacingInput | SpacingInputPublic,
): SpacingIntentInternal | undefined => {
  if (input === undefined) return undefined;

  if (input === 0) {
    return {
      all: m(0),
    };
  }

  if (isMeasurement(input) || isSpacingKeyword(input)) {
    return {
      all: input,
    };
  }

  if (
    typeof input === 'object' &&
    input !== null &&
    !Array.isArray(input)
  ) {
    return input;
  }

  throw new Error(
    '[spacing] Expected a spacing value or spacing intent object (e.g., { vertical, horizontal }). Wrap unsupported inputs accordingly.',
  );
};

type SpacingResolved = Partial<{
  top: string;
  right: string;
  bottom: string;
  left: string;
}>;

const spacingSides = (
  input?: SpacingInput | SpacingInputPublic,
): SpacingResolved => {
  const props = normalize(input);
  if (!props) return {};

  const spacing: SpacingResolved = {};

  if (
    props.top !== undefined ||
    props.vertical !== undefined ||
    props.all !== undefined
  ) {
    spacing.top = resolve(
      [
        props.top,
        props.vertical,
        props.all,
      ],
      defaultSpacing().top,
    );
  }

  if (
    props.right !== undefined ||
    props.horizontal !== undefined ||
    props.all !== undefined
  ) {
    spacing.right = resolve(
      [
        props.right,
        props.horizontal,
        props.all,
      ],
      defaultSpacing().right,
    );
  }

  if (
    props.bottom !== undefined ||
    props.vertical !== undefined ||
    props.all !== undefined
  ) {
    spacing.bottom = resolve(
      [
        props.bottom,
        props.vertical,
        props.all,
      ],
      defaultSpacing().bottom,
    );
  }

  if (
    props.left !== undefined ||
    props.horizontal !== undefined ||
    props.all !== undefined
  ) {
    spacing.left = resolve(
      [
        props.left,
        props.horizontal,
        props.all,
      ],
      defaultSpacing().left,
    );
  }

  return spacing;
};

export const paddings = (
  props?: SpacingInput | SpacingInputPublic,
) => {
  const spacing = spacingSides(props);
  const styles: Partial<{
    paddingTop: string;
    paddingRight: string;
    paddingBottom: string;
    paddingLeft: string;
  }> = {};
  if (spacing.top !== undefined) styles.paddingTop = spacing.top;
  if (spacing.right !== undefined)
    styles.paddingRight = spacing.right;
  if (spacing.bottom !== undefined)
    styles.paddingBottom = spacing.bottom;
  if (spacing.left !== undefined) styles.paddingLeft = spacing.left;
  return styles;
};

export const margins = (
  props?: SpacingInput | SpacingInputPublic,
) => {
  const spacing = spacingSides(props);
  const styles: Partial<{
    marginTop: string;
    marginRight: string;
    marginBottom: string;
    marginLeft: string;
  }> = {};
  if (spacing.top !== undefined) styles.marginTop = spacing.top;
  if (spacing.right !== undefined) styles.marginRight = spacing.right;
  if (spacing.bottom !== undefined)
    styles.marginBottom = spacing.bottom;
  if (spacing.left !== undefined) styles.marginLeft = spacing.left;
  return styles;
};
