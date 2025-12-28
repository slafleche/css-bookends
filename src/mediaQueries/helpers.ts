import type { IMeasurement } from '../core';
import { hasCssMethod } from '../core';

type MediaQueryFeatureValue = string | number | IMeasurement;

type MediaQueryFeatureEmitter = (
  name: string,
  value: MediaQueryFeatureValue,
) => void;

export interface MediaQueryBuilderHelpers {
  addFeature: MediaQueryFeatureEmitter;
}

export type MediaQueryExtensionHandler<TConfig> = (
  config: TConfig,
  helpers: MediaQueryBuilderHelpers,
) => void;

type MediaQueryBuilderOptions<TConfig> = {
  emitBase: MediaQueryExtensionHandler<TConfig>;
  emitExtensions?: MediaQueryExtensionHandler<TConfig>;
  resolveType?: (config: TConfig) => 'all' | 'print' | 'screen' | undefined;
};

export const formatMediaQueryValue = (
  value: MediaQueryFeatureValue,
): string => (hasCssMethod(value) ? value.css() : String(value));

export const buildMediaQueryStringFromParts = (
  mediaType: 'all' | 'print' | 'screen',
  parts: string[],
): string => (parts.length ? `${mediaType} and ${parts.join(' and ')}` : mediaType);

export const createMediaQueryFeatureEmitter = (
  parts: string[],
): MediaQueryFeatureEmitter =>
  (name, value) => {
    parts.push(`(${name}: ${formatMediaQueryValue(value)})`);
  };

export const createMediaQueryBuilder = <TConfig>(
  options: MediaQueryBuilderOptions<TConfig>,
) => {
  return (config: TConfig): string => {
    const parts: string[] = [];
    const helpers: MediaQueryBuilderHelpers = {
      addFeature: createMediaQueryFeatureEmitter(parts),
    };

    options.emitBase(config, helpers);
    options.emitExtensions?.(config, helpers);

    const mediaType = options.resolveType?.(config) ?? 'screen';
    return buildMediaQueryStringFromParts(mediaType, parts);
  };
};

export const buildMediaQueryFromFeatures = (
  features: Record<string, MediaQueryFeatureValue>,
  mediaType: 'all' | 'print' | 'screen' = 'screen',
): string => {
  const parts: string[] = [];
  const addFeature = createMediaQueryFeatureEmitter(parts);

  Object.entries(features).forEach(([name, value]) => {
    if (value === undefined || value === null) return;
    addFeature(name, value);
  });

  return buildMediaQueryStringFromParts(mediaType, parts);
};
