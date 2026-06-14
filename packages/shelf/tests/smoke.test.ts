import { describe, expect, it } from 'vitest';

// The shelf is factory-only: the package exports ONLY `publishShelf`. Everything else
// (the bound books + the lexicons) lives on the object that factory returns.
const pkg = await import('../dist/cjs/index.js');
const shelf = pkg.publishShelf();

describe('css-bookends shelf — factory-only contract', () => {
  it('exports only the publishShelf factory (no pre-built instance, no direct members)', () => {
    expect(typeof pkg.publishShelf).toBe('function');
    expect('color' in pkg).toBe(false);
    expect('m' in pkg).toBe(false);
    expect('mediaQueryFactory' in pkg).toBe(false);
  });
});

describe('css-bookends shelf — bundle contents', () => {
  it('binds the color book via its factory (under `color`)', () => {
    expect(typeof shelf.color).toBe('function');
    expect(shelf.color('#3366cc').css()).toBe(
      'rgba(51, 102, 204, 1)',
    );
  });

  it('bundles css-calipers straight up by name', () => {
    expect(typeof shelf.m).toBe('function');
    expect(shelf.m(8).css()).toBe('8px');
  });

  it('bundles media-queries straight up by name', () => {
    expect(typeof shelf.mediaQueryFactory).toBe('function');
    expect(typeof shelf.buildMediaQueryString).toBe('function');
  });
});

describe('css-bookends shelf — per-book config forwarding', () => {
  it('forwards the color config to publishBookColor', () => {
    const themed = pkg.publishShelf({
      color: { transparent: 'black' },
    });
    // default transparent is 'keyword' (-> 'transparent'); 'black' -> rgba(0,0,0,0).
    expect(themed.color('#00000000').css()).toBe('rgba(0, 0, 0, 0)');
  });
});
