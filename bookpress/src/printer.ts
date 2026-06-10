import type { Book, BoundOutputs, Press, PressOverrides } from './types';

/**
 * printer: the factory that makes books.
 *
 * Give it a base `press` (the three pages + defaults). It returns a `make`
 * function that stamps out a `book`, optionally rewriting any page (input,
 * storage, a named output) or the whole press, plus config:
 *
 *   const makeBorders = printer(bordersPress);
 *   const borders = makeBorders();                          // defaults
 *   const rem     = makeBorders({ config: { unit: 'rem' } }); // config override
 *   const custom  = makeBorders({ storage: myStorage });      // rewrite one page
 *   const reprint = printer(borders.press)({ ... });          // rewrite from a printed book
 */
export function printer<Raw, Store, Out, Cfg, Opts = void>(
  base: Press<Raw, Store, Out, Cfg, Opts>,
) {
  return (
    over: PressOverrides<Raw, Store, Out, Cfg, Opts> = {},
  ): Book<Raw, Store, Out, Cfg, Opts> => {
    const press: Press<Raw, Store, Out, Cfg, Opts> = {
      defaults: base.defaults,
      input: over.input ?? base.input,
      storage: over.storage ?? base.storage,
      outputs: { ...base.outputs, ...over.outputs },
      default: over.default ?? base.default,
    };

    const cfg = { ...base.defaults, ...over.config } as Cfg;
    const toStore = (raw?: Raw): Store => press.storage(press.input(raw, cfg), cfg);

    const names = Object.keys(press.outputs);
    if (names.length === 0) {
      throw new Error('bookpress: a press needs at least one output.');
    }
    const pick = press.default ?? names[0];
    if (!press.outputs[pick]) {
      throw new Error(`bookpress: default output "${pick}" is not defined.`);
    }

    const outputs: BoundOutputs<Store, Out, Opts> = {};
    for (const name of names) {
      const render = press.outputs[name];
      outputs[name] = (store: Store, opts?: Opts): Out => render(store, cfg, opts);
    }

    const book = ((raw?: Raw, opts?: Opts): Out =>
      outputs[pick](toStore(raw), opts)) as Book<Raw, Store, Out, Cfg, Opts>;
    book.store = toStore;
    book.outputs = outputs;
    book.press = press;
    return book;
  };
}
