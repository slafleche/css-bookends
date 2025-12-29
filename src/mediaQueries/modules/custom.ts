import type { IMeasurement } from '../../core';
import { hasCssMethod } from '../../core';
import type {
  MediaQueryBuilderHelpers,
  MediaQueryValidator,
} from '../helpers';
import { applyMediaQueryValidation } from '../helpers';

type MediaQueryFeatureValue = string | number | IMeasurement;

export interface IMediaQueryCustomFeatures {
  customFeatures?: Record<string, MediaQueryFeatureValue>;
}

export type MediaQueryCustomFeaturesValidator =
  MediaQueryValidator<IMediaQueryCustomFeatures>;

export const emitCustomFeatures = (
  props: IMediaQueryCustomFeatures,
  helpers: MediaQueryBuilderHelpers,
  validate?: MediaQueryCustomFeaturesValidator,
): void => {
  if (!applyMediaQueryValidation(props, helpers, validate, 'custom')) {
    return;
  }

  const { addFeature } = helpers;

  if (!props.customFeatures) return;
  Object.entries(props.customFeatures).forEach(([name, value]) => {
    if (value === undefined || value === null) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Custom feature name must be non-empty.');
    }
    if (typeof value === 'object' && !hasCssMethod(value)) {
      throw new Error(
        `Custom feature "${trimmedName}" must be a primitive or a measurement.`,
      );
    }
    addFeature(trimmedName, value);
  });
};
