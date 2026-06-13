import type { IMeasurement } from '@css-bookends/css-calipers';

import type {
  MediaQueryBuilderHelpers,
  MediaQueryValidator,
} from '../helpers';
import { applyMediaQueryValidation } from '../helpers';
import { runMediaQueryLint } from '../linting';
import { lintResolutionRedundancy } from '../linting/resolution';
import {
  defaultMediaQueryValidation,
  type MediaQueryValidation,
} from '../validation';

export interface IMediaQueryResolutionRange {
  minResolution?: IMeasurement;
  maxResolution?: IMeasurement;
  resolutionValue?: IMeasurement;
}

export type MediaQueryResolutionValidator =
  MediaQueryValidator<IMediaQueryResolutionRange>;

export const createEmitResolutionFeatures =
  (validation: MediaQueryValidation) =>
  (
    props: IMediaQueryResolutionRange,
    helpers: MediaQueryBuilderHelpers,
    validate?: MediaQueryResolutionValidator,
  ): void => {
    const { runMediaQueryValidation, validateResolutionValues } =
      validation;

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
    if (
      !applyMediaQueryValidation(
        props,
        helpers,
        validate,
        'resolution',
      )
    ) {
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

export const emitResolutionFeatures = createEmitResolutionFeatures(
  defaultMediaQueryValidation,
);
