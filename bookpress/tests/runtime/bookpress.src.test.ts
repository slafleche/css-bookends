import { describe, expect, it } from 'vitest';
import { printer, type Press } from '../../src';

/* A tiny, dependency-free "padding" book used to exercise the printer. */

type Raw = number | { all?: number; x?: number; y?: number };
interface Store {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
interface Cfg {
  unit: string;
  base: number;
}

const paddingPress: Press<Raw, Store, string, Cfg> = {
  defaults: { unit: 'px', base: 0 },
  // page 1 — accept nothing (use the global default), a number, or an axis object
  input: (raw, cfg) => {
    const value = raw ?? cfg.base;
    if (typeof value === 'number') {
      return { top: value, right: value, bottom: value, left: value };
    }
    const x = value.x ?? value.all ?? cfg.base;
    const y = value.y ?? value.all ?? cfg.base;
    return { top: y, right: x, bottom: y, left: x };
  },
  // page 2 — already canonical here
  storage: (store) => store,
  // page 3 — two valid renderings of the same store
  outputs: {
    long: (s, cfg) =>
      `padding-top:${s.top}${cfg.unit};padding-right:${s.right}${cfg.unit};` +
      `padding-bottom:${s.bottom}${cfg.unit};padding-left:${s.left}${cfg.unit}`,
    short: (s, cfg) =>
      `padding:${s.top}${cfg.unit} ${s.right}${cfg.unit} ${s.bottom}${cfg.unit} ${s.left}${cfg.unit}`,
  },
  default: 'short',
};

const makePadding = printer(paddingPress);

describe('printer', () => {
  it('is callable with no args and prints the global defaults', () => {
    expect(makePadding()()).toBe('padding:0px 0px 0px 0px');
    expect(makePadding({ config: { base: 8 } })()).toBe('padding:8px 8px 8px 8px');
  });

  it('runs input -> storage -> default output on a bare call', () => {
    expect(makePadding()(4)).toBe('padding:4px 4px 4px 4px');
  });

  it('accepts many input shapes (the input page)', () => {
    expect(makePadding()({ x: 2, y: 8 })).toBe('padding:8px 2px 8px 2px');
  });

  it('exposes named outputs with config pre-bound', () => {
    const padding = makePadding();
    const store = padding.store(4);
    expect(padding.outputs.long(store)).toBe(
      'padding-top:4px;padding-right:4px;padding-bottom:4px;padding-left:4px',
    );
  });

  it('overrides config at print time', () => {
    expect(makePadding({ config: { unit: 'rem' } })(4)).toBe('padding:4rem 4rem 4rem 4rem');
  });

  it('rewrites a single page (storage) while keeping the rest', () => {
    const noTop = makePadding({ storage: (s) => ({ ...s, top: 0 }) });
    expect(noTop(4)).toBe('padding:0px 4px 4px 4px');
  });

  it('rewrites which output a bare call uses', () => {
    expect(makePadding({ default: 'long' })(4)).toBe(
      'padding-top:4px;padding-right:4px;padding-bottom:4px;padding-left:4px',
    );
  });

  it('re-prints from a book, adding a whole new output', () => {
    const padding = makePadding();
    const csv = printer(padding.press)({
      outputs: { csv: (s) => `${s.top},${s.right},${s.bottom},${s.left}` },
      default: 'csv',
    });
    expect(csv(4)).toBe('4,4,4,4');
  });

  it('throws when the default output is missing', () => {
    const bad = printer({ ...paddingPress, default: 'nope' });
    expect(() => bad()).toThrow();
  });
});
