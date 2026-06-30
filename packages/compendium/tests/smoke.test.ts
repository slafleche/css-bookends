import { colorFormats } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

// The compendium is factory-only: the package's path is `publishCompendium`, also the
// DEFAULT export. Everything else (every bound book + the lexicons) lives on the object
// that factory returns. A bare `publishCompendium()` binds every active book at defaults.
const pkg = await import('../dist/cjs/index.js');
const c = pkg.publishCompendium();

describe('css-bookends compendium: factory + default-export contract', () => {
  it('exposes publishCompendium as a function', () => {
    expect(typeof pkg.publishCompendium).toBe('function');
  });

  it('default export IS the publishCompendium factory', () => {
    expect(pkg.default).toBe(pkg.publishCompendium);
  });
});

describe('css-bookends compendium: bundle contents', () => {
  it('binds the color book via its factory (under `color`)', () => {
    expect(typeof c.color).toBe('function');
    // default ladder is [hex, rgba, oklch]: an opaque colour renders as hex.
    expect(c.color('#3366cc').css()).toBe('#3366cc');
  });

  it('bundles css-calipers straight up by name', () => {
    expect(typeof c.m).toBe('function');
    expect(c.m(8).css()).toBe('8px');
  });

  it('binds representative per-property books, callable under their names', () => {
    expect(typeof c.opacity).toBe('function');
    // per-property books default to the `format: 'object'` shape (a property-keyed
    // style object); the bare string is available via `.value.css()`.
    expect(c.opacity(0.5).css()).toEqual({ opacity: '0.5' });

    expect(typeof c.zIndex).toBe('function');
    expect(c.zIndex(10).css()).toEqual({ zIndex: '10' });

    // composed book present under its name.
    expect(c.borders).toBeDefined();
    expect(typeof c.borders).toBe('function');
  });
});

describe('css-bookends compendium: master config forwarding', () => {
  it('threads the color config through to publishBookColor', () => {
    const themed = pkg.publishCompendium({
      color: { output: colorFormats.rgba },
    });
    // forcing rgba output: an opaque colour keeps its alpha slot (omitOpaqueAlpha off).
    expect(themed.color('#3366cc').css()).toBe(
      'rgba(51, 102, 204, 1)',
    );
  });
});
