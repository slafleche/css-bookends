import type { IMeasurement } from "../core";
import type { ComplexStyleRule, StyleRule } from "./types";
import type { MediaQueryBuilderHelpers } from "./helpers";
import { createMediaQueryBuilder } from "./helpers";
import {
  runMediaQueryValidation,
  validateMinMaxWidth,
  validateWidthValuesPositive,
} from "./validation";
import {
  emitCustomFeatures,
  emitDimensionsFeatures,
  emitDisplayFeatures,
  emitEnvironmentFeatures,
  emitInteractionFeatures,
  emitPreferencesFeatures,
  emitResolutionFeatures,
  IMediaQueryCustomFeatures,
  IMediaQueryDimensions,
  IMediaQueryDisplay,
  IMediaQueryEnvironment,
  IMediaQueryInteraction,
  IMediaQueryPreferences,
  IMediaQueryResolutionRange,
} from "./modules";

export interface IMediaQueryProps
  extends IMediaQueryCore,
    IMediaQueryDimensions,
    IMediaQueryResolutionRange,
    IMediaQueryInteraction,
    IMediaQueryPreferences,
    IMediaQueryDisplay,
    IMediaQueryEnvironment,
    IMediaQueryCustomFeatures {}

export interface IMediaQueryCore {
  type?: "all" | "print" | "screen";
  minWidth?: IMeasurement;
  maxWidth?: IMeasurement;
}

export interface IMediaQuery {
  props: IMediaQueryProps;
  styles: StyleRule;
}

export type IMediaQueries = Record<string, IMediaQueryProps>;

export type IMediaQueryStyles<T extends IMediaQueries> = Partial<
  Record<keyof T, StyleRule>
>;

export const emitCoreFeatures = (
  props: IMediaQueryCore,
  helpers: MediaQueryBuilderHelpers
): void => {
  if (
    !runMediaQueryValidation(
      props,
      helpers,
      validateMinMaxWidth,
      "core",
      "minWidth must be less than or equal to maxWidth"
    )
  ) {
    return;
  }
  if (
    !runMediaQueryValidation(
      props,
      helpers,
      validateWidthValuesPositive,
      "core",
      "width values must be greater than 0"
    )
  ) {
    return;
  }
  const { addFeature } = helpers;

  if (props.minWidth) {
    addFeature("min-width", props.minWidth);
  }
  if (props.maxWidth) {
    addFeature("max-width", props.maxWidth);
  }
};

const emitBaseFeatures = (
  props: IMediaQueryProps,
  helpers: MediaQueryBuilderHelpers
): void => {
  emitCoreFeatures(props, helpers);
  emitDimensionsFeatures(props, helpers);
  emitResolutionFeatures(props, helpers);
  emitInteractionFeatures(props, helpers);
  emitPreferencesFeatures(props, helpers);
  emitDisplayFeatures(props, helpers);
  emitEnvironmentFeatures(props, helpers);
  emitCustomFeatures(props, helpers);
};

export const buildMediaQueryString = createMediaQueryBuilder({
  emitBase: emitBaseFeatures,
  resolveType: (props) => props.type,
});

export const makeMediaQueryStyle =
  <T extends IMediaQueries>(queries: T) =>
  (stylesByQuery: IMediaQueryStyles<T>): ComplexStyleRule => {
    const result: Record<string, StyleRule> = {};

    (Object.keys(stylesByQuery) as (keyof T)[]).forEach((key) => {
      const styles = stylesByQuery[key];
      const props = queries[key];
      if (!styles || !props) return;
      result[buildMediaQueryString(props)] = styles;
    });

    const mediaQuery: ComplexStyleRule = {
      "@media": result,
    };
    return mediaQuery;
  };
