import type {
  MediaQueryBuilderHelpers,
  MediaQueryValidator,
} from '../helpers';
import { applyMediaQueryValidation } from '../helpers';

export interface IMediaQueryInteraction {
  hover?: 'none' | 'hover';
  anyHover?: 'none' | 'hover';
  pointer?: 'none' | 'coarse' | 'fine';
  anyPointer?: 'none' | 'coarse' | 'fine';
  update?: 'none' | 'slow' | 'fast';
}

export type MediaQueryInteractionValidator =
  MediaQueryValidator<IMediaQueryInteraction>;

export const emitInteractionFeatures = (
  props: IMediaQueryInteraction,
  helpers: MediaQueryBuilderHelpers,
  validate?: MediaQueryInteractionValidator,
): void => {
  if (
    !applyMediaQueryValidation(props, helpers, validate, 'interaction')
  ) {
    return;
  }

  const { addFeature } = helpers;

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
};
