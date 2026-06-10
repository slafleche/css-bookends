import { m } from '@css-bookends/css-calipers';
import { color } from '@css-bookends/colours';
import { describe, expect, it } from 'vitest';

import {
  boxShadow,
  globalDropShadowFilter,
  globalDropShadowFilterFlush,
  shadowTotalX,
  shadowTotalY,
} from '../../src/shadows';

describe('shadow.helper', () => {
  it('formats single and multiple box shadows', () => {
    const singleStyle = boxShadow({
      x: m(1),
      y: m(2),
      blur: m(3),
      color: color('#5b4199'),
      alpha: 0.5,
    });
    expect(singleStyle.boxShadow).toBe(
      '1px 2px 3px 0 rgb(91 65 153 / 0.5)',
    );

    const multiStyle = boxShadow([
      { x: m(0), y: m(1) },
      { x: m(1), y: m(2), inset: true },
    ]);
    expect(multiStyle.boxShadow).toContain(' inset');
    expect(multiStyle.boxShadow.split(', ')).toHaveLength(2);

    const singleValue = boxShadow.value({
      x: m(1),
      y: m(2),
      blur: m(3),
      color: color('#5b4199'),
      alpha: 0.5,
    });
    expect(singleValue).toBe('1px 2px 3px 0 rgb(91 65 153 / 0.5)');
  });

  it('builds drop-shadow filters with defaults', () => {
    const filter = globalDropShadowFilter();
    expect(filter.startsWith('drop-shadow(')).toBe(true);

    const flush = globalDropShadowFilterFlush({
      x: m(2),
      y: m(0),
      blur: m(4),
    });
    expect(flush.split('drop-shadow')).toHaveLength(3);
  });

  it('computes total shadow spans on each axis', () => {
    const spanY = shadowTotalY({
      y: m(3),
      blur: m(2),
    });
    expect(spanY.css()).toBe('7px');

    const spanX = shadowTotalX({
      x: m(4),
      blur: m(1),
    });
    expect(spanX.css()).toBe('6px');
  });
});
