/**
 * bookpress types: the vocabulary a printer works with.
 *
 *   press    the definition of a book: its three pages plus config defaults
 *   printer  the factory that stamps a book from a press (rewriting any page or the whole press)
 *   book     the workable library a printer produces
 *
 * The three pages of every book:
 *   1. input    accept many raw shapes, parse into the canonical store
 *   2. storage  normalize the canonical store (apply defaults, merges, resolution)
 *   3. output   one or more renderers from the store to CSS (longform, shorthand, ...)
 */

/**
 * Page 1: parse a permissive raw input into the canonical store.
 * `raw` is optional: a bare call (`borders()`) passes `undefined`, and the input
 * page is expected to seed the store from `cfg` (the global defaults).
 */
export type InputPage<Raw, Store, Cfg> = (raw: Raw | undefined, cfg: Cfg) => Store;

/** Page 2: normalize the canonical store into its final, trusted form. */
export type StoragePage<Store, Cfg> = (store: Store, cfg: Cfg) => Store;

/** Page 3: render the canonical store to output. A book may have several, keyed by name. */
export type OutputPage<Store, Out, Cfg, Opts> = (store: Store, cfg: Cfg, opts?: Opts) => Out;

/** The three pages of a book plus its config defaults. */
export interface Press<Raw, Store, Out, Cfg, Opts = void> {
  /** config defaults; merged with per-print `config` overrides. */
  defaults: Cfg;
  input: InputPage<Raw, Store, Cfg>;
  storage: StoragePage<Store, Cfg>;
  /** one or more named renderers; `default` (or the first key) is used by a bare call. */
  outputs: Record<string, OutputPage<Store, Out, Cfg, Opts>>;
  /** name of the output a bare call renders; defaults to the first output key. */
  default?: string;
}

/** Overrides applied when printing: rewrite any page (or the whole press) and/or config. */
export type PressOverrides<Raw, Store, Out, Cfg, Opts = void> = Partial<
  Press<Raw, Store, Out, Cfg, Opts>
> & {
  config?: Partial<Cfg>;
};

/** Renderers with config pre-bound, exposed on a printed book for composition. */
export type BoundOutputs<Store, Out, Opts> = Record<string, (store: Store, opts?: Opts) => Out>;

/** A printed book: callable (renders the default output), with its pages exposed. */
export interface Book<Raw, Store, Out, Cfg, Opts = void> {
  /** render `raw` through input -> storage -> default output. A bare call uses the global defaults. */
  (raw?: Raw, opts?: Opts): Out;
  /** run pages 1+2: raw -> canonical store (for composing across books). */
  store(raw?: Raw): Store;
  /** page-3 renderers, config pre-bound, keyed by name. */
  outputs: BoundOutputs<Store, Out, Opts>;
  /** the fully resolved press, to re-print with further overrides. */
  press: Press<Raw, Store, Out, Cfg, Opts>;
}
