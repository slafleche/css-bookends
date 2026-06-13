import type { Book, Manuscript, ManuscriptOverrides } from './types';

/**
 * publishBook: the generic engine that binds books.
 *
 * Give it a `manuscript` (the three steps + defaults) and it returns a factory that
 * publishes a `book`. An override may REPLACE a step (`input`, `storage`, `output`)
 * or the whole manuscript, or WRAP a step via `wrap`: a `(base) => step` decorator
 * that runs around the current step. Replace happens first, then the wrap decorates
 * the result, so the two compose. Wraps stack as an onion across re-publishes (the
 * resolved steps live on `book.manuscript`, so re-publishing wraps them again,
 * newest ring outermost). Each book builds its own public factory from this engine
 * with its manuscript baked in, named `publishBook<Name>`.
 */
export function publishBook<
  Raw,
  Store,
  Out extends { css(): unknown },
  Cfg,
  Opts = void,
>(base: Manuscript<Raw, Store, Out, Cfg, Opts>) {
  return (
    over: ManuscriptOverrides<Raw, Store, Out, Cfg, Opts> = {},
  ): Book<Raw, Store, Out, Cfg, Opts> => {
    const wrap = over.wrap;

    // each step: replace first, then wrap the result (decorator / onion).
    const replacedInput = over.input ?? base.input;
    const input = wrap?.input
      ? wrap.input(replacedInput)
      : replacedInput;

    const replacedStorage = over.storage ?? base.storage;
    const storage = wrap?.storage
      ? wrap.storage(replacedStorage)
      : replacedStorage;

    const replacedOutput = over.output ?? base.output;
    const output = wrap?.output
      ? wrap.output(replacedOutput)
      : replacedOutput;

    const manuscript: Manuscript<Raw, Store, Out, Cfg, Opts> = {
      defaults: base.defaults,
      input,
      storage,
      output,
    };

    const cfg = { ...base.defaults, ...over.config } as Cfg;
    const toStore = (raw?: Raw): Store =>
      manuscript.storage(manuscript.input(raw, cfg), cfg);

    const book = ((raw?: Raw, opts?: Opts): Out =>
      manuscript.output(toStore(raw), cfg, opts)) as Book<
      Raw,
      Store,
      Out,
      Cfg,
      Opts
    >;
    book.store = toStore;
    book.manuscript = manuscript;
    return book;
  };
}
