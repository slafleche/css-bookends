import type { IMediaQueryCore } from './mediaQueries';
import type {
  IMediaQueryCustomFeatures,
  IMediaQueryDimensions,
  IMediaQueryDisplay,
  IMediaQueryEnvironment,
  IMediaQueryInteraction,
  IMediaQueryPreferences,
  IMediaQueryResolutionRange,
} from './modules';

export type MediaQueryModuleId =
  | 'core'
  | 'dimensions'
  | 'resolution'
  | 'interaction'
  | 'preferences'
  | 'display'
  | 'environment'
  | 'custom';

export type MediaQueryModulePropsMap = {
  core: IMediaQueryCore;
  dimensions: IMediaQueryDimensions;
  resolution: IMediaQueryResolutionRange;
  interaction: IMediaQueryInteraction;
  preferences: IMediaQueryPreferences;
  display: IMediaQueryDisplay;
  environment: IMediaQueryEnvironment;
  custom: IMediaQueryCustomFeatures;
};

export type MediaQueryModuleKeysMap = {
  core: 'type' | 'minWidth' | 'maxWidth';
  dimensions:
    | 'width'
    | 'height'
    | 'minHeight'
    | 'maxHeight'
    | 'aspectRatio'
    | 'minAspectRatio'
    | 'maxAspectRatio'
    | 'orientation';
  resolution: 'resolutionValue' | 'minResolution' | 'maxResolution';
  interaction: 'hover' | 'anyHover' | 'pointer' | 'anyPointer' | 'update';
  preferences:
    | 'colorScheme'
    | 'reducedMotion'
    | 'reducedData'
    | 'contrast'
    | 'forcedColors';
  display: 'colorGamut' | 'dynamicRange' | 'invertedColors';
  environment: 'scripting' | 'overflowBlock' | 'overflowInline';
  custom: 'customFeatures';
};

export type MediaQueryModuleKeys<M extends MediaQueryModuleId> =
  MediaQueryModuleKeysMap[M];

export type MediaQueryModulesList = readonly MediaQueryModuleId[];

export const defineMediaQueryModules = <T extends MediaQueryModulesList>(
  ...modules: T
): T => modules;
