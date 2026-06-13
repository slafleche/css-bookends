/**
 * self-publish types: the vocabulary publishBook works with.
 *
 *   manuscript  a book's definition: its three steps plus config defaults
 *   publishBook the engine that binds a book from a manuscript (overriding any step)
 *   book        the workable library publishBook produces
 *
 * The three steps of every book:
 *   1. input    accept many raw shapes, parse into the canonical store
 *   2. storage  normalize the canonical store (apply defaults, merges, resolution)
 *   3. output   build the book's result; it must expose `.css()`, and may do more
 */

/** Step 1: parse a permissive raw input into the canonical store. */
export type Input<Raw, Store, Cfg> = (
  raw: Raw | undefined,
  cfg: Cfg,
) => Store;

/** Step 2: normalize the canonical store into its final, trusted form. */
export type Storage<Store, Cfg> = (store: Store, cfg: Cfg) => Store;

/** Step 3: build the book's result from the store. The result must expose `.css()`. */
export type Output<Store, Out, Cfg, Opts = void> = (
  store: Store,
  cfg: Cfg,
  opts?: Opts,
) => Out;

/** A book's definition: the three steps plus config defaults. */
export interface Manuscript<
  Raw,
  Store,
  Out extends { css(): unknown },
  Cfg,
  Opts = void,
> {
  /** config defaults; merged with per-publish `config` overrides. */
  defaults: Cfg;
  input: Input<Raw, Store, Cfg>;
  storage: Storage<Store, Cfg>;
  output: Output<Store, Out, Cfg, Opts>;
}

/**
 * Wrap (decorate) a step instead of replacing it. Each entry is an enhancer that
 * receives the current step and returns a new one, so it can run before, after, or
 * around the original. Wraps compose as an onion across re-publishes: each
 * re-publish layers a new ring outside the previous (newest outermost).
 */
export interface ManuscriptWrap<
  Raw,
  Store,
  Out extends { css(): unknown },
  Cfg,
  Opts = void,
> {
  input?: (base: Input<Raw, Store, Cfg>) => Input<Raw, Store, Cfg>;
  storage?: (base: Storage<Store, Cfg>) => Storage<Store, Cfg>;
  output?: (
    base: Output<Store, Out, Cfg, Opts>,
  ) => Output<Store, Out, Cfg, Opts>;
}

/**
 * Overrides applied when publishing:
 *  - REPLACE any step (or the whole manuscript) and/or config, or
 *  - `wrap` a step to decorate it (onion) instead of replacing it.
 */
export type ManuscriptOverrides<
  Raw,
  Store,
  Out extends { css(): unknown },
  Cfg,
  Opts = void,
> = Partial<Manuscript<Raw, Store, Out, Cfg, Opts>> & {
  config?: Partial<Cfg>;
  wrap?: ManuscriptWrap<Raw, Store, Out, Cfg, Opts>;
};

/** A published book: callable (builds the result), with its store + manuscript exposed. */
export interface Book<
  Raw,
  Store,
  Out extends { css(): unknown },
  Cfg,
  Opts = void,
> {
  /** run input -> storage -> output. A bare call uses the global defaults. */
  (raw?: Raw, opts?: Opts): Out;
  /** run input + storage: raw -> canonical store (for composing across books). */
  store(raw?: Raw): Store;
  /** the fully resolved manuscript, to re-publish with further overrides. */
  manuscript: Manuscript<Raw, Store, Out, Cfg, Opts>;
}
