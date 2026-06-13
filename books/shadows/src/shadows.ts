import { color, type ColorWrapper } from '@css-bookends/colours';
import { type IMeasurement, m } from '@css-bookends/css-calipers';
import type * as CSS_TYPES from 'csstype';

// Neutral built-in defaults (inherited from the portfolio drop-shadow tokens;
// review them, see notes.md). Callers override any field per call.
const shadowDefaults = {
  offsetX: m(2),
  offsetY: m(2),
  blur: m(2),
  alpha: 1,
  color: color('#000'),
};

export interface IBoxShadow {
  x?: IMeasurement;
  y?: IMeasurement;
  blur?: IMeasurement;
  spread?: IMeasurement;
  alpha?: number;
  inset?: boolean;
  color?: ColorWrapper;
}

// Will default to global set of default value
const formatBoxShadow = (props: IBoxShadow = {}) => {
  const {
    x = shadowDefaults.offsetX,
    y = shadowDefaults.offsetY,
    blur = shadowDefaults.blur,
    color = shadowDefaults.color,
    alpha = shadowDefaults.alpha,
    inset = false,
  } = props || {};
  const finalColor =
    alpha || alpha !== 1 ? color.alpha(alpha) : color;
  return `${x.css()} ${y.css()} ${blur.css()} 0 ${finalColor.css()}${inset ? ' inset' : ''}`;
};

export type IBoxShadowTokens = IBoxShadow | ReadonlyArray<IBoxShadow>;

const isBoxShadowList = (
  input: IBoxShadowTokens,
): input is ReadonlyArray<IBoxShadow> => Array.isArray(input);

const boxShadowValue = (
  input: IBoxShadowTokens = {},
): CSS_TYPES.Property.BoxShadow => {
  if (isBoxShadowList(input)) {
    return input.map((entry) => formatBoxShadow(entry)).join(', ');
  }
  return formatBoxShadow(input);
};

type BoxShadowComposer = {
  (input?: IBoxShadowTokens): {
    boxShadow: CSS_TYPES.Property.BoxShadow;
  };
  value: typeof boxShadowValue;
};

export const boxShadow = ((input: IBoxShadowTokens = {}) => ({
  boxShadow: boxShadowValue(input),
})) as BoxShadowComposer;

boxShadow.value = boxShadowValue;

// CSS filter: drop-shadow() helper, using global defaults
export const globalDropShadowFilter = (props: IBoxShadow = {}) => {
  const {
    x = shadowDefaults.offsetX,
    y = shadowDefaults.offsetY,
    blur = shadowDefaults.blur,
    // spread not supported by drop-shadow()
    color = shadowDefaults.color,
  } = props || {};
  return `drop-shadow(${x.css()} ${y.css()} ${blur.css()} ${color.css()})`;
};

// Fudged CSS drop-shadow that avoids a flush-side gap by layering
// an unshifted blur under the shifted shadow. No extra path or SVG merge.
export const globalDropShadowFilterFlush = (
  props: IBoxShadow = {},
) => {
  const {
    x = shadowDefaults.offsetX,
    y = shadowDefaults.offsetY,
    blur = shadowDefaults.blur,
    color = shadowDefaults.color,
  } = props || {};
  const base = `drop-shadow(0 0 ${blur.css()} ${color.css()})`;
  const shifted = `drop-shadow(${x.css()} ${y.css()} ${blur.css()} ${color.css()})`;
  return `${base} ${shifted}`;
};

// Convenience: total vertical span needed for the shadow (offsetY + 2 * blur)
// Useful for padding viewBox/filter regions to avoid clipping
export const shadowTotalY = (
  props: IBoxShadow = {},
): IMeasurement => {
  const y = props.y ?? shadowDefaults.offsetY;
  const blur = props.blur ?? shadowDefaults.blur;
  const unit = y.getUnit();
  y.assertUnit(unit, 'shadowTotalY offsetY');
  blur.assertUnit(unit, 'shadowTotalY blur');
  return m(y.getValue() + 2 * blur.getValue(), unit);
};

// Convenience: total horizontal span needed for the shadow (offsetX + 2 * blur)
export const shadowTotalX = (
  props: IBoxShadow = {},
): IMeasurement => {
  const x = props.x ?? shadowDefaults.offsetX;
  const blur = props.blur ?? shadowDefaults.blur;
  const unit = x.getUnit();
  x.assertUnit(unit, 'shadowTotalX offsetX');
  blur.assertUnit(unit, 'shadowTotalX blur');
  return m(x.getValue() + 2 * blur.getValue(), unit);
};

export interface ITextShadow {
  x?: IMeasurement;
  y?: IMeasurement;
  blur?: IMeasurement;
  color?: ColorWrapper;
}

export const textShadow = (props: ITextShadow = {}) => {
  const {
    x = shadowDefaults.offsetX ?? m(0),
    y = shadowDefaults.offsetY ?? m(0),
    blur = shadowDefaults.blur ?? m(0),
    color = shadowDefaults.color ?? shadowDefaults.color,
  } = props;
  return {
    textShadow: `${x.css()} ${y.css()} ${blur.css()} ${color.css()}`,
  };
};
