import { describe, expect, it } from 'vitest';

import { createSupportsFallback } from '../../src/supportsFallback';

describe('supports-fallback', () => {
  it('returns supported/fallback @supports data for each selector', () => {
    const applySupports = createSupportsFallback('display: grid');
    const rules = applySupports({
      selector: [
        '.foo',
        '#bar',
      ],
      supported: { display: 'grid' },
      fallback: { display: 'block' },
    });

    expect(rules).toHaveLength(2);
    expect(rules[0]).toEqual({
      selector: '.foo',
      style: {
        '@supports': {
          '(display: grid)': { display: 'grid' },
          'not (display: grid)': { display: 'block' },
        },
      },
    });
    expect(rules[1].selector).toBe('#bar');
  });

  it('accepts a single selector and normalizes a parenthesized query', () => {
    const rules = createSupportsFallback('(gap: 1px)')({
      selector: '.x',
      supported: { gap: '1px' },
      fallback: { marginTop: '1px' },
    });
    expect(rules).toHaveLength(1);
    expect(rules[0].selector).toBe('.x');
    expect(Object.keys(rules[0].style['@supports'])).toEqual([
      '(gap: 1px)',
      'not (gap: 1px)',
    ]);
  });

  it('rejects blank queries', () => {
    expect(() => createSupportsFallback('  ')).toThrow(
      /non-empty query/,
    );
  });
});
