import { m, mPercent } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import backdropFilters, {
  backdropFilterValue,
} from '../../src/backdropFilter';

describe('backdropFilter.helper', () => {
  it('builds filter strings from multiple intents', () => {
    const value = backdropFilterValue(
      {
        blur: m(8),
        saturate: mPercent(120),
      },
      { brightness: 1.2 },
    );
    expect(value).toBe('blur(8px) saturate(120%) brightness(1.2)');
  });

  it('exposes .style() shorthand with prefixed properties', () => {
    const styles = backdropFilters.style({
      contrast: mPercent(90),
    });
    expect(styles).toEqual({
      backdropFilter: 'contrast(90%)',
      WebkitBackdropFilter: 'contrast(90%)',
    });
  });

  it('returns empty object when no intents supplied', () => {
    expect(backdropFilters()).toEqual({});
  });
});
