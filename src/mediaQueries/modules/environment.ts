import type {
  MediaQueryBuilderHelpers,
  MediaQueryValidator,
} from '../helpers';
import { applyMediaQueryValidation } from '../helpers';

export interface IMediaQueryEnvironment {
  scripting?: 'none' | 'initial-only' | 'enabled';
  overflowBlock?: 'none' | 'scroll' | 'paged';
  overflowInline?: 'none' | 'scroll';
}

export type MediaQueryEnvironmentValidator =
  MediaQueryValidator<IMediaQueryEnvironment>;

export const emitEnvironmentFeatures = (
  props: IMediaQueryEnvironment,
  helpers: MediaQueryBuilderHelpers,
  validate?: MediaQueryEnvironmentValidator,
): void => {
  if (
    !applyMediaQueryValidation(props, helpers, validate, 'environment')
  ) {
    return;
  }

  const { addFeature } = helpers;

  if (props.scripting) {
    addFeature('scripting', props.scripting);
  }
  if (props.overflowBlock) {
    addFeature('overflow-block', props.overflowBlock);
  }
  if (props.overflowInline) {
    addFeature('overflow-inline', props.overflowInline);
  }
};
