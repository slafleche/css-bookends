import { describe, expect, it } from 'vitest';

// The bookshelf should re-export both the calipers lexicon and the
// media-queries book from its single entry point.
const shelf = await import('../dist/cjs/index.js');

describe('css-bookends bookshelf', () => {
  it('re-exports the calipers measurement helper (m)', () => {
    expect(typeof shelf.m).toBe('function');
    expect(shelf.m(8).css()).toBe('8px');
  });

  it('re-exports the media query factory', () => {
    expect(typeof shelf.mediaQueryFactory).toBe('function');
    expect(typeof shelf.buildMediaQueryString).toBe('function');
  });

  it('exposes a colours book produced by the factory (not the raw helper)', () => {
    expect(typeof shelf.colours).toBe('function'); // the factory-made instance
    expect(typeof shelf.bookPressColours).toBe('function'); // the factory itself
    expect('color' in shelf).toBe(false); // raw helper is NOT surfaced
    expect(shelf.colours('#3366cc').css()).toBe('rgb(51 102 204)');
    expect(shelf.colours('#3366cc').css(shelf.colorFormats.hex)).toBe(
      '#3366cc',
    );
  });
});
