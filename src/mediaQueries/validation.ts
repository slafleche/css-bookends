import type {
  MediaQueryBuilderHelpers,
  MediaQueryValidationResult,
} from './helpers';
import { applyMediaQueryValidation } from './helpers';
import { assertCondition, assertMatchingUnits } from '../core';
import type { IMediaQueryCore } from './mediaQueries';
import type { IMediaQueryDimensions } from './modules/dimensions';
import type { IMediaQueryResolutionRange } from './modules/resolution';
import type { IMeasurement } from '../core';

export type MediaQueryValidationCheck<TConfig> = (config: TConfig) => void;

const toValidationResult = (
  error: unknown,
  fallback: string,
): MediaQueryValidationResult => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export const runMediaQueryValidation = <TConfig>(
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

export const validateMinMaxWidth = (props: IMediaQueryCore): void => {
  if (!props.minWidth || !props.maxWidth) return;
  assertMatchingUnits(
    props.minWidth,
    props.maxWidth,
    'mediaQueries.minMaxWidth',
  );
  assertCondition(
    props.minWidth.getValue() <= props.maxWidth.getValue(),
    'minWidth must be less than or equal to maxWidth',
  );
};

export const validateWidthValuesPositive = (
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

export const validateMinMaxHeight = (
  props: IMediaQueryDimensions,
): void => {
  if (!props.minHeight || !props.maxHeight) return;
  assertMatchingUnits(
    props.minHeight,
    props.maxHeight,
    'mediaQueries.minMaxHeight',
  );
  assertCondition(
    props.minHeight.getValue() <= props.maxHeight.getValue(),
    'minHeight must be less than or equal to maxHeight',
  );
};

export const validateHeightValuesPositive = (
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

const parseAspectRatio = (
  value: IMediaQueryDimensions['aspectRatio'],
): number | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes('/')) {
    const [left, right] = trimmed.split('/');
    if (left === undefined || right === undefined) return null;
    const numerator = Number(left.trim());
    const denominator = Number(right.trim());
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
      return null;
    }
    if (denominator === 0) return null;
    return numerator / denominator;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

export const validateMinMaxAspectRatio = (
  props: IMediaQueryDimensions,
): void => {
  if (!props.minAspectRatio || !props.maxAspectRatio) return;
  const minRatio = parseAspectRatio(props.minAspectRatio);
  const maxRatio = parseAspectRatio(props.maxAspectRatio);
  assertCondition(
    minRatio !== null && maxRatio !== null,
    'aspectRatio values must be valid numbers or ratio strings',
  );
  assertCondition(
    (minRatio as number) <= (maxRatio as number),
    'minAspectRatio must be less than or equal to maxAspectRatio',
  );
};

export const validateAspectRatioValuesPositive = (
  props: IMediaQueryDimensions,
): void => {
  const assertValidPositive = (label: string, value: number | null): void => {
    assertCondition(
      value !== null && value > 0,
      `${label} must be a valid ratio greater than 0`,
    );
  };

  if (props.aspectRatio !== undefined) {
    assertValidPositive(
      'aspectRatio',
      parseAspectRatio(props.aspectRatio),
    );
  }
  if (props.minAspectRatio !== undefined) {
    assertValidPositive(
      'minAspectRatio',
      parseAspectRatio(props.minAspectRatio),
    );
  }
  if (props.maxAspectRatio !== undefined) {
    assertValidPositive(
      'maxAspectRatio',
      parseAspectRatio(props.maxAspectRatio),
    );
  }
};

export const validateResolutionValues = (
  props: IMediaQueryResolutionRange,
): void => {
  const assertPositive = (value: IMeasurement, label: string): void => {
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
  if (props.minResolution && props.maxResolution) {
    assertMatchingUnits(
      props.minResolution,
      props.maxResolution,
      'mediaQueries.resolutionUnits',
    );
  }
};
