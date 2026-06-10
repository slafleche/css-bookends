import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import {
  absolutePosition,
  flexMiddle,
  flexPosition,
  fullSizeOfParent,
  inheritHeight,
} from '../../src/positioning';

describe('positioning.helper', () => {
  it('builds absolute corner helpers with measurement defaults', () => {
    expect(absolutePosition.topLeft(m(4), m(8))).toEqual({
      position: 'absolute',
      top: '4px',
      left: '8px',
    });

    expect(absolutePosition.bottomRight()).toEqual({
      position: 'absolute',
      bottom: '0px',
      right: '0px',
    });
  });

  it('centers absolutely positioned elements via middle helper', () => {
    expect(absolutePosition.middle(true)).toMatchObject({
      position: 'absolute',
      display: 'inline-block',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    });

    expect(absolutePosition.middle()).toMatchObject({
      position: 'absolute',
      display: 'block',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      marginTop: 'auto',
      marginRight: 'auto',
      marginBottom: 'auto',
      marginLeft: 'auto',
    });
  });

  it('exposes flex shorthands for layout alignment', () => {
    expect(flexPosition.center(true)).toEqual({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
    });
    expect(flexPosition.middleRight().justifyContent).toBe(
      'flex-end',
    );
  });

  it('provides full-size/flex utilities for containers', () => {
    expect(fullSizeOfParent()).toEqual({
      position: 'absolute',
      display: 'block',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    });

    expect(flexMiddle()).toEqual({
      display: 'flex',
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    });

    expect(inheritHeight()).toEqual({
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      position: 'relative',
    });
  });
});
