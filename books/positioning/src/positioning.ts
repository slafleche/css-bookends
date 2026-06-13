import { type IMeasurement, m } from '@css-bookends/css-calipers';
import { margins } from '@css-bookends/spacing';
import type * as CSS_TYPES from 'csstype';
export const absolutePosition = {
  topRight: (
    top: IMeasurement = m(0),
    right: IMeasurement = m(0),
  ) => {
    return {
      position: 'absolute' as CSS_TYPES.Property.Position,
      top: top.css() as CSS_TYPES.Property.Top,
      right: right.css() as CSS_TYPES.Property.Right,
    };
  },
  topLeft: (top: IMeasurement = m(0), left: IMeasurement = m(0)) => {
    return {
      position: 'absolute' as CSS_TYPES.Property.Position,
      top: top.css() as CSS_TYPES.Property.Top,
      left: left.css() as CSS_TYPES.Property.Left,
    };
  },
  bottomRight: (
    bottom: IMeasurement = m(0),
    right: IMeasurement = m(0),
  ) => {
    return {
      position: 'absolute' as CSS_TYPES.Property.Position,
      bottom: bottom.css() as CSS_TYPES.Property.Bottom,
      right: right.css() as CSS_TYPES.Property.Right,
    };
  },
  bottomLeft: (
    bottom: IMeasurement = m(0),
    left: IMeasurement = m(0),
  ) => {
    return {
      position: 'absolute' as CSS_TYPES.Property.Position,
      bottom: bottom.css() as CSS_TYPES.Property.Bottom,
      left: left.css() as CSS_TYPES.Property.Left,
    };
  },
  middle: (shrink: boolean = false) => {
    if (shrink) {
      return {
        position: 'absolute' as CSS_TYPES.Property.Position,
        display: 'inline-block' as CSS_TYPES.Property.Display,
        top: '50%' as CSS_TYPES.Property.Top,
        left: '50%' as CSS_TYPES.Property.Left,
        right: 'initial' as CSS_TYPES.Property.Right,
        bottom: 'initial' as CSS_TYPES.Property.Bottom,
        transform:
          'translate(-50%, -50%)' as CSS_TYPES.Property.Transform,
      };
    } else {
      return {
        position: 'absolute' as CSS_TYPES.Property.Position,
        display: 'block' as CSS_TYPES.Property.Display,
        top: 0 as CSS_TYPES.Property.Top,
        left: 0 as CSS_TYPES.Property.Left,
        right: 0 as CSS_TYPES.Property.Right,
        bottom: 0 as CSS_TYPES.Property.Bottom,
        maxHeight: '100%' as CSS_TYPES.Property.MaxHeight,
        maxWidth: '100%' as CSS_TYPES.Property.MaxWidth,
        ...margins('auto'),
      };
    }
  },
  middleLeft: (left: IMeasurement = m(0)) => {
    return {
      position: 'absolute' as CSS_TYPES.Property.Position,
      display: 'block' as CSS_TYPES.Property.Display,
      top: 0 as CSS_TYPES.Property.Top,
      left: left.css() as CSS_TYPES.Property.Left,
      bottom: 0 as CSS_TYPES.Property.Bottom,
      maxHeight: '100%' as CSS_TYPES.Property.MaxHeight,
      maxWidth: '100%' as CSS_TYPES.Property.MaxWidth,
      ...margins({ vertical: 'auto' }),
    };
  },
  middleRight: (right: IMeasurement = m(0)) => {
    return {
      position: 'absolute' as CSS_TYPES.Property.Position,
      display: 'block' as CSS_TYPES.Property.Display,
      top: 0 as CSS_TYPES.Property.Top,
      right: right.css() as CSS_TYPES.Property.Right,
      bottom: 0 as CSS_TYPES.Property.Bottom,
      maxHeight: '100%' as CSS_TYPES.Property.MaxHeight,
      maxWidth: '100%' as CSS_TYPES.Property.MaxWidth,
      ...margins({ vertical: 'auto' }),
    };
  },
  middleBottom: (bottom: IMeasurement = m(0)) => {
    return {
      position: 'absolute' as CSS_TYPES.Property.Position,
      display: 'block' as CSS_TYPES.Property.Display,
      bottom: bottom.css() as CSS_TYPES.Property.Bottom,
      left: 0 as CSS_TYPES.Property.Left,
      right: 0 as CSS_TYPES.Property.Right,
      maxHeight: '100%' as CSS_TYPES.Property.MaxHeight,
      maxWidth: '100%' as CSS_TYPES.Property.MaxWidth,
      ...margins({
        horizontal: 'auto',
        vertical: m(0),
      }),
    };
  },
  middleTop: (top: IMeasurement = m(0)) => {
    return {
      position: 'absolute' as CSS_TYPES.Property.Position,
      display: 'block' as CSS_TYPES.Property.Display,
      top: top.css() as CSS_TYPES.Property.Top,
      left: 0 as CSS_TYPES.Property.Left,
      right: 0 as CSS_TYPES.Property.Right,
      maxHeight: '100%' as CSS_TYPES.Property.MaxHeight,
      maxWidth: '100%' as CSS_TYPES.Property.MaxWidth,
      ...margins({
        horizontal: 'auto',
        vertical: m(0),
      }),
    };
  },
  fullSize: () => {
    return {
      display: 'block' as CSS_TYPES.Property.Display,
      position: 'absolute' as CSS_TYPES.Property.Position,
      top: 0 as CSS_TYPES.Property.Top,
      left: 0 as CSS_TYPES.Property.Left,
      width: '100%' as CSS_TYPES.Property.Width,
      height: '100%' as CSS_TYPES.Property.Height,
    };
  },
};

export const flexPosition = {
  center: (wrap = false) => {
    return {
      display: 'flex' as CSS_TYPES.Property.Display,
      alignItems: 'center' as CSS_TYPES.Property.AlignItems,
      justifyContent: 'center' as CSS_TYPES.Property.JustifyContent,
      flexWrap: (wrap
        ? 'wrap'
        : 'nowrap') as CSS_TYPES.Property.FlexWrap,
    };
  },

  middleLeft: (wrap = false) => {
    return {
      display: 'flex' as CSS_TYPES.Property.Display,
      alignItems: 'center' as CSS_TYPES.Property.AlignItems,
      justifyContent:
        'flex-start' as CSS_TYPES.Property.JustifyContent,
      flexWrap: wrap
        ? 'wrap'
        : ('nowrap' as CSS_TYPES.Property.FlexWrap),
    };
  },

  middleRight: (wrap = false) => {
    return {
      display: 'flex' as CSS_TYPES.Property.Display,
      alignItems: 'center' as CSS_TYPES.Property.AlignItems,
      justifyContent: 'flex-end' as CSS_TYPES.Property.JustifyContent,
      flexWrap: wrap
        ? 'wrap'
        : ('nowrap' as CSS_TYPES.Property.FlexWrap),
    };
  },
};

export function flexMiddle() {
  return {
    display: 'flex' as CSS_TYPES.Property.Flex,
    width: '100%' as CSS_TYPES.Property.Width,
    height: '100%' as CSS_TYPES.Property.Height,
    justifyContent: 'center' as CSS_TYPES.Property.JustifyContent,
    alignItems: 'center' as CSS_TYPES.Property.AlignItems,
  };
}

export function fullSizeOfParent() {
  return {
    position: 'absolute' as CSS_TYPES.Property.Position,
    display: 'block' as CSS_TYPES.Property.Display,
    top: 0 as CSS_TYPES.Property.Top,
    left: 0 as CSS_TYPES.Property.Left,
    width: '100%' as CSS_TYPES.Property.Width,
    height: '100%' as CSS_TYPES.Property.Height,
  };
}

export function inheritHeight() {
  return {
    display: 'flex' as CSS_TYPES.Property.Display,
    flexDirection: 'column' as CSS_TYPES.Property.FlexDirection,
    flexGrow: 1 as CSS_TYPES.Property.FlexGrow,
    position: 'relative' as CSS_TYPES.Property.Position,
  };
}
