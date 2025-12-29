import type { IMeasurement } from '../../core';
import type {
  MediaQueryBuilderHelpers,
  MediaQueryValidator,
} from '../helpers';
import { applyMediaQueryValidation } from '../helpers';
import { runMediaQueryValidation, validateResolutionValues } from '../validation';
import { runMediaQueryLint } from '../linting';
import { lintResolutionRedundancy } from '../linting/resolution';

export interface IMediaQueryResolutionRange {
  minResolution?: IMeasurement;
  maxResolution?: IMeasurement;
  resolutionValue?: IMeasurement;
}

export type MediaQueryResolutionValidator =
  MediaQueryValidator<IMediaQueryResolutionRange>;

export const emitResolutionFeatures = (
  props: IMediaQueryResolutionRange,
  helpers: MediaQueryBuilderHelpers,
  validate?: MediaQueryResolutionValidator,
): void => {
  if (
    !runMediaQueryValidation(
      props,
      helpers,
      validateResolutionValues,
      'resolution',
      'resolution values must be greater than 0',
    )
  ) {
    return;
  }
  if (
    !runMediaQueryLint(
      props,
      helpers,
      lintResolutionRedundancy,
      'resolution should not be combined with minResolution or maxResolution',
    )
  ) {
    return;
  }
  if (!applyMediaQueryValidation(props, helpers, validate, 'resolution')) {
    return;
  }

  const { addFeature } = helpers;

  if (props.resolutionValue) {
    addFeature('resolution', props.resolutionValue);
  }
  if (props.minResolution) {
    addFeature('min-resolution', props.minResolution);
  }
  if (props.maxResolution) {
    addFeature('max-resolution', props.maxResolution);
  }
};
