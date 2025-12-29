import type {
  MediaQueryBuilderHelpers,
  MediaQueryValidator,
} from '../helpers';
import { applyMediaQueryValidation } from '../helpers';

export interface IMediaQueryPreferences {
  colorScheme?: 'light' | 'dark';
  reducedMotion?: 'no-preference' | 'reduce';
  reducedData?: 'no-preference' | 'reduce';
  contrast?: 'no-preference' | 'more' | 'less';
  forcedColors?: 'none' | 'active';
}

export type MediaQueryPreferencesValidator =
  MediaQueryValidator<IMediaQueryPreferences>;

export const emitPreferencesFeatures = (
  props: IMediaQueryPreferences,
  helpers: MediaQueryBuilderHelpers,
  validate?: MediaQueryPreferencesValidator,
): void => {
  if (
    !applyMediaQueryValidation(props, helpers, validate, 'preferences')
  ) {
    return;
  }

  const { addFeature } = helpers;

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
};
