import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import {
  paddingManuscript,
  publishBookPadding,
} from '../../src/padding';

/*
 * The padding BOOK's factory (the OUTPUT step wired through bookpress): publishBookPadding binds
 * a book; calling it runs input -> storage -> output. The input gate is INHERITED through the
 * factory, so negatives / `auto` / `anchor-size()` throw on a book call.
 */

describe('publishBookPadding — factory wiring', () => {
  it('builds a callable book that emits the longhand style object by default', () => {
    const padding = publishBookPadding();
    expect(padding(m(4)).css()).toEqual({
      paddingTop: '4px',
      paddingRight: '4px',
      paddingBottom: '4px',
      paddingLeft: '4px',
    });
  });

  it('exposes .store (the tagged canonical store) and .manuscript', () => {
    const padding = publishBookPadding();
    expect(padding.store({ top: m(2) })).toEqual({
      top: { kind: 'length', value: m(2) },
    });
    expect(padding.manuscript).toEqual(paddingManuscript);
  });

  it('a bare call yields an empty result', () => {
    expect(publishBookPadding()().css()).toEqual({});
  });
});

describe('publishBookPadding — config overrides', () => {
  it('emit:shorthand collapses a complete store', () => {
    const padding = publishBookPadding({
      config: { emit: 'shorthand' },
    });
    expect(padding({ x: m(8), y: m(4) }).css()).toEqual({
      padding: '4px 8px',
    });
  });

  it('format:string emits a declaration string', () => {
    const padding = publishBookPadding({
      config: { format: 'string' },
    });
    expect(padding({ top: m(2) }).css()).toBe('padding-top: 2px');
  });
});

describe('publishBookPadding — the input gate is inherited', () => {
  it('throws on a negative value through the factory', () => {
    expect(() => publishBookPadding()(m(-4))).toThrow(/>= 0/);
    expect(() => publishBookPadding()({ left: m(-1) })).toThrow(
      />= 0/,
    );
  });

  it('throws on auto through the factory (padding forbids it)', () => {
    expect(() => publishBookPadding()('auto' as never)).toThrow();
  });
});
