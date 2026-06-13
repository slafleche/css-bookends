import { type IMeasurement, m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { type Manuscript, publishBook } from '../../src';

/*
 * A throwaway demo book to exercise the engine (not a real helper). Its value is a
 * css-calipers measurement (`m()`); its result exposes `.css()` (required) plus a
 * `.double()` alternate render, mirroring how a real book's result is richer than
 * just `.css()` (e.g. colours' ResolvedColour).
 *
 * css-calipers is a devDependency only: it does not depend on bookpress (no cycle),
 * and bookpress keeps zero runtime dependencies.
 */
type Raw = number;
interface Store {
  size: IMeasurement;
}
interface Cfg {
  base: number;
  unit: string;
}
interface DemoOut {
  css(): string;
  double(): string;
}

const demoManuscript: Manuscript<Raw, Store, DemoOut, Cfg> = {
  defaults: { base: 0, unit: 'px' },
  input: (raw, cfg) => ({ size: m(raw ?? cfg.base, cfg.unit) }), // step 1
  storage: (s) => s, // step 2 (already canonical)
  output: (s) => ({
    css: () => s.size.css(),
    double: () => s.size.double().css(),
  }), // step 3 (result with .css() and a richer .double())
};

const makeDemo = publishBook(demoManuscript);

describe('publishBook', () => {
  it('is callable with no args and uses the global defaults', () => {
    expect(makeDemo()().css()).toBe('0px');
    expect(makeDemo({ config: { base: 8 } })().css()).toBe('8px');
  });

  it('runs input -> storage -> output on a bare call', () => {
    expect(makeDemo()(4).css()).toBe('4px');
  });

  it('the result is richer than css (a .double() alternate render)', () => {
    expect(makeDemo()(4).double()).toBe('8px');
  });

  it('store() runs input + storage for composing across books', () => {
    expect(makeDemo().store(4).size.css()).toBe('4px');
  });

  it('overrides config at publish time', () => {
    expect(makeDemo({ config: { unit: 'rem' } })(4).css()).toBe(
      '4rem',
    );
  });

  it('replaces a single step (storage) while keeping the rest', () => {
    expect(
      makeDemo({ storage: (s) => ({ size: s.size.add(1) }) })(
        4,
      ).css(),
    ).toBe('5px');
  });

  it('re-publishes from a book, replacing the output', () => {
    const demo = makeDemo();
    const reissued = publishBook(demo.manuscript)({
      output: (s) => ({
        css: () => s.size.double().css(),
        double: () => s.size.double().css(),
      }),
    });
    expect(reissued(4).css()).toBe('8px');
  });
});

describe('publishBook — wrap (onion)', () => {
  it('wrap.storage decorates the base step (wrap-only wraps base)', () => {
    const bumped = makeDemo({
      wrap: {
        storage: (base) => (s, cfg) => ({
          size: base(s, cfg).size.add(100),
        }),
      },
    });
    expect(bumped(4).css()).toBe('104px');
  });

  it('wrap.input composes around base (runs before base parses)', () => {
    const offset = makeDemo({
      wrap: {
        input: (base) => (raw, cfg) => base((raw ?? 0) + 10, cfg),
      },
    });
    expect(offset(4).css()).toBe('14px');
  });

  it('wrap.output decorates the result', () => {
    const bracketed = makeDemo({
      wrap: {
        output: (base) => (s, cfg, opts) => {
          const r = base(s, cfg, opts);
          return { ...r, css: () => `[${r.css()}]` };
        },
      },
    });
    expect(bracketed(4).css()).toBe('[4px]');
  });

  it('replace + wrap compose: the wrap receives the replaced step', () => {
    const r = makeDemo({
      storage: () => ({ size: m(1) }), // replace: 1px
      wrap: {
        storage: (base) => (s, cfg) => ({
          size: base(s, cfg).size.add(10),
        }),
      },
    });
    expect(r(4).css()).toBe('11px'); // 1 (replaced) + 10 (wrap)
  });

  it('onion: re-publishing stacks wraps newest-outermost', () => {
    const order: string[] = [];
    const ring =
      (label: string) =>
      (base: Manuscript<Raw, Store, DemoOut, Cfg>['storage']) =>
      (s: Store, cfg: Cfg): Store => {
        order.push(label);
        return base(s, cfg);
      };

    const inner = makeDemo({ wrap: { storage: ring('inner') } });
    const outer = publishBook(inner.manuscript)({
      wrap: { storage: ring('outer') },
    });

    outer(4);
    expect(order).toEqual([
      'outer',
      'inner',
    ]); // newest ring runs first / outermost
  });
});
