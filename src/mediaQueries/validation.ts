import type {
  MediaQueryBuilderHelpers,
  MediaQueryValidationResult,
} from './helpers';
import { applyMediaQueryValidation } from './helpers';
import {
  assertCondition,
  isRatio,
  ratioToFloat,
  type IRatio,
} from '../core';
import type { IMediaQueryCore } from './mediaQueries';
import type { IMediaQueryDimensions } from './modules/dimensions';
import type { IMediaQueryResolutionRange } from './modules/resolution';
import type { IMeasurement } from '../core';

export type MediaQueryValidationCheck<TConfig> = (config: TConfig) => void;

export type MediaQueryCoreHelpers = {
  assertCondition: typeof assertCondition;
};

export type MediaQueryValidation = ReturnType<
  typeof createMediaQueryValidation
>;

const toValidationResult = (
  error: unknown,
  fallback: string,
): MediaQueryValidationResult => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export const createMediaQueryValidation = (
  core: MediaQueryCoreHelpers,
) => {
  const { assertCondition } = core;

  const runMediaQueryValidation = <TConfig>(
    config: TConfig,
    helpers: MediaQueryBuilderHelpers,
    check?: MediaQueryValidationCheck<TConfig>,
    context?: string,
    fallbackMessage = 'Invalid media query configuration',
  ): boolean => {
    if (!check) return true;
    try {
      check(config);
      return true;
    } catch (error) {
      const result = toValidationResult(error, fallbackMessage);
      return applyMediaQueryValidation(
        config,
        helpers,
        () => result,
        context,
      );
    }
  };

  const validateMinMaxWidth = (props: IMediaQueryCore): void => {
    if (!props.minWidth || !props.maxWidth) return;
    // Mixed units are valid CSS — each bound is evaluated independently — so we
    // only enforce ordering when the units match and the comparison is meaningful.
    if (props.minWidth.getUnit() !== props.maxWidth.getUnit()) return;
    assertCondition(
      props.minWidth.getValue() <= props.maxWidth.getValue(),
      'minWidth must be less than or equal to maxWidth',
    );
  };

  const validateWidthValuesPositive = (
    props: IMediaQueryCore & IMediaQueryDimensions,
  ): void => {
    const assertPositive = (
      value: IMeasurement,
      label: string,
    ): void => {
      assertCondition(
        value.getValue() > 0,
        `${label} must be greater than 0`,
      );
    };

    if (props.width) {
      assertPositive(props.width, 'width');
    }
    if (props.minWidth) {
      assertPositive(props.minWidth, 'minWidth');
    }
    if (props.maxWidth) {
      assertPositive(props.maxWidth, 'maxWidth');
    }
  };

  const validateMinMaxHeight = (
    props: IMediaQueryDimensions,
  ): void => {
    if (!props.minHeight || !props.maxHeight) return;
    // Mixed units are valid CSS; only enforce ordering when units match.
    if (props.minHeight.getUnit() !== props.maxHeight.getUnit()) return;
    assertCondition(
      props.minHeight.getValue() <= props.maxHeight.getValue(),
      'minHeight must be less than or equal to maxHeight',
    );
  };

  const validateHeightValuesPositive = (
    props: IMediaQueryDimensions,
  ): void => {
    const assertPositive = (
      value: IMeasurement,
      label: string,
    ): void => {
      assertCondition(
        value.getValue() > 0,
        `${label} must be greater than 0`,
      );
    };

    if (props.height) {
      assertPositive(props.height, 'height');
    }
    if (props.minHeight) {
      assertPositive(props.minHeight, 'minHeight');
    }
    if (props.maxHeight) {
      assertPositive(props.maxHeight, 'maxHeight');
    }
  };

  const validateMinMaxAspectRatio = (
    props: IMediaQueryDimensions,
  ): void => {
    if (!props.minAspectRatio || !props.maxAspectRatio) return;
    const assertRatio: (
      value: unknown,
      label: string,
    ) => asserts value is IRatio = (value, label) => {
      assertCondition(
        isRatio(value),
        `${label} must be a ratio created with r()`,
      );
    };
    assertRatio(props.minAspectRatio, 'minAspectRatio');
    assertRatio(props.maxAspectRatio, 'maxAspectRatio');
    const minRatio = ratioToFloat(props.minAspectRatio);
    const maxRatio = ratioToFloat(props.maxAspectRatio);
    assertCondition(
      minRatio <= maxRatio,
      'minAspectRatio must be less than or equal to maxAspectRatio',
    );
  };

  const validateAspectRatioValuesPositive = (
    props: IMediaQueryDimensions,
  ): void => {
    const assertRatio: (
      value: unknown,
      label: string,
    ) => asserts value is IRatio = (value, label) => {
      assertCondition(
        isRatio(value),
        `${label} must be a ratio created with r()`,
      );
    };
    const assertValidPositive = (
      label: string,
      ratio: IRatio,
    ): void => {
      assertCondition(
        ratioToFloat(ratio) > 0,
        `${label} must be a valid ratio greater than 0`,
      );
    };

    if (props.aspectRatio !== undefined) {
      assertRatio(props.aspectRatio, 'aspectRatio');
      assertValidPositive('aspectRatio', props.aspectRatio);
    }
    if (props.minAspectRatio !== undefined) {
      assertRatio(props.minAspectRatio, 'minAspectRatio');
      assertValidPositive('minAspectRatio', props.minAspectRatio);
    }
    if (props.maxAspectRatio !== undefined) {
      assertRatio(props.maxAspectRatio, 'maxAspectRatio');
      assertValidPositive('maxAspectRatio', props.maxAspectRatio);
    }
  };

  const validateResolutionValues = (
    props: IMediaQueryResolutionRange,
  ): void => {
    const assertPositive = (
      value: IMeasurement,
      label: string,
    ): void => {
      assertCondition(
        value.getValue() > 0,
        `${label} must be greater than 0`,
      );
    };

    if (props.resolutionValue) {
      assertPositive(props.resolutionValue, 'resolution');
    }
    if (props.minResolution) {
      assertPositive(props.minResolution, 'minResolution');
    }
    if (props.maxResolution) {
      assertPositive(props.maxResolution, 'maxResolution');
    }
    // Resolution bounds may use different units (dpi, dpcm, dppx, x) — all
    // valid CSS — so we no longer require min/max to share a unit.
  };

  return {
    runMediaQueryValidation,
    validateMinMaxWidth,
    validateWidthValuesPositive,
    validateMinMaxHeight,
    validateHeightValuesPositive,
    validateMinMaxAspectRatio,
    validateAspectRatioValuesPositive,
    validateResolutionValues,
  };
};

const defaultMediaQueryValidation = createMediaQueryValidation({
  assertCondition,
});

export const {
  runMediaQueryValidation,
  validateMinMaxWidth,
  validateWidthValuesPositive,
  validateMinMaxHeight,
  validateHeightValuesPositive,
  validateMinMaxAspectRatio,
  validateAspectRatioValuesPositive,
  validateResolutionValues,
} = defaultMediaQueryValidation;

export { defaultMediaQueryValidation };
