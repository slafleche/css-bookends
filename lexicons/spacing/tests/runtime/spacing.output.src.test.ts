import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import {
  anchorSizeToCss,
  makeSpacingResult,
  slotToCss,
} from '../../src/render';
import { anchorSize, resolveSpacing } from '../../src/spacing';
import type { SpacingConfig } from '../../src/types';

/*
 * OUTPUT step of the spacing LEXICON: `slotToCss` renders one tagged slot; `makeSpacingResult`
 * builds the result object (the `emit x format` 2x2, shorthand collapsing, the side/axis
 * accessors, and the partial-store fallback). Stores are built with `resolveSpacing` so the
 * tagging matches the real pipeline.
 */

const cfg = (over: Partial<SpacingConfig> = {}): SpacingConfig => ({
  emit: 'longhand',
  format: 'object',
  ...over,
});

describe('slotToCss — one slot to its bare value', () => {
  it('renders the length, symbolic, and anchor-size kinds', () => {
    expect(slotToCss({ kind: 'length', value: m(4, 'px') })).toBe(
      '4px',
    );
    expect(slotToCss({ kind: 'length', value: 0 })).toBe('0px');
    expect(slotToCss({ kind: 'symbolic', keyword: 'auto' })).toBe(
      'auto',
    );
    expect(slotToCss({ kind: 'symbolic', keyword: 'inherit' })).toBe(
      'inherit',
    );
    expect(slotToCss(anchorSize({ size: 'width' }))).toBe(
      'anchor-size(width)',
    );
  });

  it('renders a full anchor-size() with anchor + fallback', () => {
    expect(
      anchorSizeToCss(
        anchorSize({
          anchor: '--btn',
          size: 'inline',
          fallback: m(50),
        }),
      ),
    ).toBe('anchor-size(--btn inline, 50px)');
  });
});

describe('makeSpacingResult — emit x format (full store)', () => {
  const store = resolveSpacing({
    top: m(1),
    right: m(2),
    bottom: m(3),
    left: m(4),
  });

  it('longhand + object: a per-side style object (default)', () => {
    expect(makeSpacingResult(store, cfg(), 'margin').css()).toEqual({
      marginTop: '1px',
      marginRight: '2px',
      marginBottom: '3px',
      marginLeft: '4px',
    });
  });

  it('longhand + string: a declaration string', () => {
    expect(
      makeSpacingResult(
        store,
        cfg({ format: 'string' }),
        'padding',
      ).css(),
    ).toBe(
      'padding-top: 1px; padding-right: 2px; padding-bottom: 3px; padding-left: 4px',
    );
  });

  it('shorthand + object: the collapsed shorthand key', () => {
    expect(
      makeSpacingResult(
        store,
        cfg({ emit: 'shorthand' }),
        'margin',
      ).css(),
    ).toEqual({ margin: '1px 2px 3px 4px' });
  });

  it('shorthand + string: the collapsed declaration', () => {
    expect(
      makeSpacingResult(
        store,
        cfg({ emit: 'shorthand', format: 'string' }),
        'margin',
      ).css(),
    ).toBe('margin: 1px 2px 3px 4px');
  });
});

describe('makeSpacingResult — shorthand collapsing', () => {
  const shorthand = (
    input: Parameters<typeof resolveSpacing>[0],
  ): unknown =>
    makeSpacingResult(
      resolveSpacing(input),
      cfg({ emit: 'shorthand' }),
      'margin',
    ).css();

  it('collapses 4 equal to 1', () => {
    expect(shorthand(m(4))).toEqual({ margin: '4px' });
  });

  it('collapses a b a b to "a b"', () => {
    expect(
      shorthand({ top: m(1), right: m(2), bottom: m(1), left: m(2) }),
    ).toEqual({ margin: '1px 2px' });
  });

  it('collapses a b c b to "a b c"', () => {
    expect(
      shorthand({ top: m(1), right: m(2), bottom: m(3), left: m(2) }),
    ).toEqual({ margin: '1px 2px 3px' });
  });

  it('keeps four distinct values', () => {
    expect(
      shorthand({ top: m(1), right: m(2), bottom: m(3), left: m(4) }),
    ).toEqual({ margin: '1px 2px 3px 4px' });
  });
});

describe('makeSpacingResult — side + axis accessors', () => {
  // partial store: top + the inline (left/right) sides, no bottom.
  const r = makeSpacingResult(
    resolveSpacing({ top: m(4), x: m(8) }),
    cfg(),
    'margin',
  );

  it('a side: () is the declaration, .css() is the bare value', () => {
    expect(r.top()).toEqual({ marginTop: '4px' });
    expect(r.top.css()).toBe('4px');
  });

  it('an absent side is undefined for both forms', () => {
    expect(r.bottom()).toBeUndefined();
    expect(r.bottom.css()).toBeUndefined();
  });

  it('x() emits both inline sides; x.css() is the shared value when equal', () => {
    expect(r.x()).toEqual({ marginLeft: '8px', marginRight: '8px' });
    expect(r.x.css()).toBe('8px');
  });

  it('an axis .css() is undefined when its sides differ or one is absent', () => {
    const uneven = makeSpacingResult(
      resolveSpacing({ left: m(8), right: m(4) }),
      cfg(),
      'margin',
    );
    expect(uneven.x.css()).toBeUndefined();
    // y has neither side -> undefined for both forms.
    expect(uneven.y()).toBeUndefined();
    expect(uneven.y.css()).toBeUndefined();
  });

  it('string format: a side () is a single declaration', () => {
    const rs = makeSpacingResult(
      resolveSpacing({ top: m(4) }),
      cfg({ format: 'string' }),
      'margin',
    );
    expect(rs.top()).toBe('margin-top: 4px');
  });
});

describe('makeSpacingResult — forced forms + partial store', () => {
  const partial = makeSpacingResult(
    resolveSpacing({ top: m(4) }),
    cfg({ emit: 'shorthand' }),
    'margin',
  );

  it('.css() with emit:shorthand falls back to longhand on a partial store', () => {
    expect(partial.css()).toEqual({ marginTop: '4px' });
  });

  it('.shorthand() throws on a partial store', () => {
    expect(() => partial.shorthand()).toThrow(/all four sides/);
  });

  it('.longhand() forces longhand even when emit is shorthand', () => {
    const full = makeSpacingResult(
      resolveSpacing(m(4)),
      cfg({ emit: 'shorthand' }),
      'margin',
    );
    expect(full.css()).toEqual({ margin: '4px' }); // configured shorthand
    expect(full.longhand()).toEqual({
      marginTop: '4px',
      marginRight: '4px',
      marginBottom: '4px',
      marginLeft: '4px',
    });
  });

  it('renders a symbolic (auto) and an anchor-size value verbatim', () => {
    const sym = makeSpacingResult(
      resolveSpacing({ left: 'auto' }),
      cfg(),
      'margin',
    );
    expect(sym.left.css()).toBe('auto');
    const anchor = makeSpacingResult(
      resolveSpacing({ top: anchorSize({ size: 'width' }) }),
      cfg(),
      'margin',
    );
    expect(anchor.top.css()).toBe('anchor-size(width)');
  });
});
