import { describe, expect, it } from 'vitest';

import {
  borders,
  color,
  m,
  opacity,
  shadows,
  zIndex,
} from '../src/defaults';

describe('compendium /defaults: bound, zero-config helpers', () => {
  it('exposes the lexicon helpers bound at defaults', () => {
    expect(typeof m).toBe('function');
    expect(m(8).css()).toBe('8px');
  });

  it('exposes factory books bound at defaults', () => {
    // per-property books default to the `format: 'object'` shape (property-keyed).
    expect(opacity(0.5).css()).toEqual({ opacity: '0.5' });
    expect(zIndex(10).css()).toEqual({ zIndex: '10' });
    expect(typeof borders).toBe('function');
  });

  it('exposes the bound colour BOOK (not the calipers value fn)', () => {
    // the bound book renders via the default ladder: an opaque colour is hex.
    expect(color('#3366cc').css()).toBe('#3366cc');
  });

  it('exposes the composed-book namespaces', () => {
    expect(typeof shadows).toBe('object');
    expect('boxShadow' in shadows).toBe(true);
  });
});
