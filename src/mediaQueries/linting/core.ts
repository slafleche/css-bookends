import type { IMediaQueryCore } from '../mediaQueries';
import type { IMediaQueryDimensions } from '../modules/dimensions';

export const lintWidthRedundancy = (
  props: IMediaQueryCore & IMediaQueryDimensions,
): void => {
  if (!props.width) return;
  if (props.minWidth || props.maxWidth) {
    throw new Error(
      'width should not be combined with minWidth or maxWidth',
    );
  }
};

export const lintHeightRedundancy = (
  props: IMediaQueryDimensions,
): void => {
  if (!props.height) return;
  if (props.minHeight || props.maxHeight) {
    throw new Error(
      'height should not be combined with minHeight or maxHeight',
    );
  }
};
