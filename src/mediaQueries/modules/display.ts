import type {
  MediaQueryBuilderHelpers,
  MediaQueryValidator,
} from '../helpers';
import { applyMediaQueryValidation } from '../helpers';

export interface IMediaQueryDisplay {
  colorGamut?: 'srgb' | 'p3' | 'rec2020';
  dynamicRange?: 'standard' | 'high';
  invertedColors?: 'none' | 'inverted';
}

export type MediaQueryDisplayValidator =
  MediaQueryValidator<IMediaQueryDisplay>;

export const emitDisplayFeatures = (
  props: IMediaQueryDisplay,
  helpers: MediaQueryBuilderHelpers,
  validate?: MediaQueryDisplayValidator,
): void => {
  if (!applyMediaQueryValidation(props, helpers, validate, 'display')) {
    return;
  }

  const { addFeature } = helpers;

  if (props.colorGamut) {
    addFeature('color-gamut', props.colorGamut);
  }
  if (props.dynamicRange) {
    addFeature('dynamic-range', props.dynamicRange);
  }
  if (props.invertedColors) {
    addFeature('inverted-colors', props.invertedColors);
  }
};
