import type { IMeasurement } from '../core';
import type { ComplexStyleRule, StyleRule } from './types';
import type { MediaQueryBuilderHelpers } from './helpers';
import { createMediaQueryBuilder } from './helpers';

type MediaQueryRatio = number | string;

type MediaQueryFeatureValue = string | number | IMeasurement;

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
  type?: 'all' | 'print' | 'screen';
  minWidth?: IMeasurement;
  maxWidth?: IMeasurement;
}

export interface IMediaQueryDimensions {
  width?: IMeasurement;
  minHeight?: IMeasurement;
  maxHeight?: IMeasurement;
  height?: IMeasurement;
  aspectRatio?: MediaQueryRatio;
  minAspectRatio?: MediaQueryRatio;
  maxAspectRatio?: MediaQueryRatio;
  orientation?: 'landscape' | 'portrait';
}

export interface IMediaQueryResolutionRange {
  minResolution?: IMeasurement;
  maxResolution?: IMeasurement;
  resolutionValue?: IMeasurement;
}

export interface IMediaQueryInteraction {
  hover?: 'none' | 'hover';
  anyHover?: 'none' | 'hover';
  pointer?: 'none' | 'coarse' | 'fine';
  anyPointer?: 'none' | 'coarse' | 'fine';
  update?: 'none' | 'slow' | 'fast';
}

export interface IMediaQueryPreferences {
  colorScheme?: 'light' | 'dark';
  reducedMotion?: 'no-preference' | 'reduce';
  reducedData?: 'no-preference' | 'reduce';
  contrast?: 'no-preference' | 'more' | 'less';
  forcedColors?: 'none' | 'active';
}

export interface IMediaQueryDisplay {
  colorGamut?: 'srgb' | 'p3' | 'rec2020';
  dynamicRange?: 'standard' | 'high';
  invertedColors?: 'none' | 'inverted';
}

export interface IMediaQueryEnvironment {
  scripting?: 'none' | 'initial-only' | 'enabled';
  overflowBlock?: 'none' | 'scroll' | 'paged';
  overflowInline?: 'none' | 'scroll';
}

export interface IMediaQueryCustomFeatures {
  customFeatures?: Record<string, MediaQueryFeatureValue>;
}

export interface IMediaQuery {
  props: IMediaQueryProps;
  styles: StyleRule;
}

export type IMediaQueries = Record<string, IMediaQueryProps>;

export type IMediaQueryStyles<T extends IMediaQueries> = Partial<
  Record<keyof T, StyleRule>
>;

const emitBaseFeatures = (
  props: IMediaQueryProps,
  helpers: MediaQueryBuilderHelpers,
): void => {
  const { addFeature } = helpers;

  if (props.minWidth) {
    addFeature('min-width', props.minWidth);
  }
  if (props.maxWidth) {
    addFeature('max-width', props.maxWidth);
  }
  if (props.width) {
    addFeature('width', props.width);
  }
  if (props.height) {
    addFeature('height', props.height);
  }
  if (props.minHeight) {
    addFeature('min-height', props.minHeight);
  }
  if (props.maxHeight) {
    addFeature('max-height', props.maxHeight);
  }
  if (props.aspectRatio) {
    addFeature('aspect-ratio', props.aspectRatio);
  }
  if (props.minAspectRatio) {
    addFeature('min-aspect-ratio', props.minAspectRatio);
  }
  if (props.maxAspectRatio) {
    addFeature('max-aspect-ratio', props.maxAspectRatio);
  }
  if (props.orientation) {
    addFeature('orientation', props.orientation);
  }
  if (props.resolutionValue) {
    addFeature('resolution', props.resolutionValue);
  }
  if (props.minResolution) {
    addFeature('min-resolution', props.minResolution);
  }
  if (props.maxResolution) {
    addFeature('max-resolution', props.maxResolution);
  }
  if (props.hover) {
    addFeature('hover', props.hover);
  }
  if (props.anyHover) {
    addFeature('any-hover', props.anyHover);
  }
  if (props.pointer) {
    addFeature('pointer', props.pointer);
  }
  if (props.anyPointer) {
    addFeature('any-pointer', props.anyPointer);
  }
  if (props.update) {
    addFeature('update', props.update);
  }
  if (props.colorScheme) {
    addFeature('prefers-color-scheme', props.colorScheme);
  }
  if (props.reducedMotion) {
    addFeature('prefers-reduced-motion', props.reducedMotion);
  }
  if (props.reducedData) {
    addFeature('prefers-reduced-data', props.reducedData);
  }
  if (props.contrast) {
    addFeature('prefers-contrast', props.contrast);
  }
  if (props.forcedColors) {
    addFeature('forced-colors', props.forcedColors);
  }
  if (props.colorGamut) {
    addFeature('color-gamut', props.colorGamut);
  }
  if (props.dynamicRange) {
    addFeature('dynamic-range', props.dynamicRange);
  }
  if (props.invertedColors) {
    addFeature('inverted-colors', props.invertedColors);
  }
  if (props.scripting) {
    addFeature('scripting', props.scripting);
  }
  if (props.overflowBlock) {
    addFeature('overflow-block', props.overflowBlock);
  }
  if (props.overflowInline) {
    addFeature('overflow-inline', props.overflowInline);
  }
  if (props.customFeatures) {
    Object.entries(props.customFeatures).forEach(([name, value]) => {
      if (value === undefined || value === null) return;
      addFeature(name, value);
    });
  }
};

export const buildMediaQueryString = createMediaQueryBuilder({
  emitBase: emitBaseFeatures,
  resolveType: (props) => props.type,
});

export const makeMediaQueryStyle =
  <T extends IMediaQueries>(queries: T) =>
  (
    stylesByQuery: IMediaQueryStyles<T>,
  ): ComplexStyleRule => {
    const result: Record<string, StyleRule> = {};

    (Object.keys(stylesByQuery) as (keyof T)[]).forEach((key) => {
      const styles = stylesByQuery[key];
      const props = queries[key];
      if (!styles || !props) return;
      result[buildMediaQueryString(props)] = styles;
    });

    const mediaQuery: ComplexStyleRule = {
      '@media': result,
    };
    return mediaQuery;
  };
