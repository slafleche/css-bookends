import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import {
  anchorSize,
  marginManuscript,
  publishBookMargin,
} from '../../src/margin';

/*
 * The margin BOOK's factory (the OUTPUT step wired through bookpress): publishBookMargin binds
 * a book; calling it runs input -> storage -> output. The 2x2 (emit x format) is covered by the
 * lexicon output suite; here we assert the wiring, the config overrides, and margin's
 * first-class `auto` / `anchor-size()`.
 */

describe('publishBookMargin — factory wiring', () => {
  it('builds a callable book that emits the longhand style object by default', () => {
    const margin = publishBookMargin();
    expect(margin(m(4)).css()).toEqual({
      marginTop: '4px',
      marginRight: '4px',
      marginBottom: '4px',
      marginLeft: '4px',
    });
  });

  it('exposes .store (the tagged canonical store) and .manuscript', () => {
    const margin = publishBookMargin();
    expect(margin.store({ top: m(2) })).toEqual({
      top: { kind: 'length', value: m(2) },
    });
    expect(margin.manuscript).toEqual(marginManuscript);
  });

  it('a bare call yields an empty result', () => {
    expect(publishBookMargin()().css()).toEqual({});
  });
});

describe('publishBookMargin — config overrides', () => {
  it('emit:shorthand collapses a complete store', () => {
    const margin = publishBookMargin({
      config: { emit: 'shorthand' },
    });
    expect(margin(m(4)).css()).toEqual({ margin: '4px' });
  });

  it('format:string emits a declaration string', () => {
    const margin = publishBookMargin({
      config: { format: 'string' },
    });
    expect(margin({ top: m(2) }).css()).toBe('margin-top: 2px');
  });
});

describe('publishBookMargin — margin-only values', () => {
  it('renders auto (first-class for margin)', () => {
    const margin = publishBookMargin();
    expect(margin({ left: 'auto' }).css()).toEqual({
      marginLeft: 'auto',
    });
  });

  it('renders an anchor-size() value', () => {
    const margin = publishBookMargin();
    expect(
      margin({
        top: anchorSize({ anchor: '--btn', size: 'inline' }),
      }).css(),
    ).toEqual({ marginTop: 'anchor-size(--btn inline)' });
  });
});
