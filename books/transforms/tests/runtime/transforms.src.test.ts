import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import transforms, {
  transformStyle,
  transformValue,
} from '../../src/transforms';

describe('transforms.helper', () => {
  it('composes translate/rotate/scale/skew/perspective parts', () => {
    const value = transformValue({
      translate: { x: m(10), y: m(20) },
      rotate: { value: m(45, 'deg') },
      scale: { x: 1.2, y: 0.8 },
      skew: { x: m(5, 'deg') },
      perspective: m(500),
    });

    expect(value).toBe(
      'translate(10px, 20px) rotate(45deg) scaleX(1.2) scaleY(0.8) skewX(5deg) perspective(500px)',
    );
  });

  it('supports translate3d, rotate axes, scale3d via multiple intents', () => {
    const value = transformValue({
      translate: { x: m(5), y: m(6), z: m(7) },
      rotate: { x: m(10, 'deg'), y: m(20, 'deg'), z: m(30, 'deg') },
      scale: { x: 2, y: 3, z: 4 },
    });

    expect(value).toContain('translate3d(5px, 6px, 7px)');
    expect(value).toContain('rotateX(10deg)');
    expect(value).toContain('rotateY(20deg)');
    expect(value).toContain('rotateZ(30deg)');
    expect(value).toContain('scaleX(2)');
    expect(value).toContain('scaleY(3)');
    expect(value).toContain('scaleZ(4)');
  });

  it('defaults scale x/y to xy and allows overrides', () => {
    const value = transformValue({
      scale: { xy: 1.1, x: 0.9 },
    });

    expect(value).toBe('scaleX(0.9) scaleY(1.1)');
  });

  it('deduplicates custom strings and filters empty entries', () => {
    const value = transformValue({
      custom: [
        'matrix(1,0,0,1,0,0)',
        ' ',
        null,
      ],
    });
    expect(value).toBe('matrix(1,0,0,1,0,0)');
  });

  it('returns undefined when no transforms provided', () => {
    expect(transformValue()).toBeUndefined();
  });

  it('exposes helper with style() shorthand', () => {
    const styles = transforms({ rotate: { value: m(15, 'deg') } });
    expect(styles).toEqual({ transform: 'rotate(15deg)' });
    expect(transformStyle()).toEqual({});
  });
});
