---
name: authoring-a-book
description: How to build or rework a CSS-Bookends book with self-publish, the publishBook engine, the manuscript, and the three steps (input, storage, output). Use whenever adding or changing a book/helper in this repo.
---

# authoring-a-book

A **book** is a workable library for one CSS concern (borders, shadows, spacing).
Books are **Layer 2** of the stack: helpers that consume the Layer-1 calipers
primitives; a helper never lives in calipers (canonical three-layer model in
`.claude/CLAUDE.md` / `AGENTS.md`). Every book is bound by **publishBook** from
`@css-bookends/self-publish`, from a **manuscript** definition made of three
**steps**. See `/ARCHITECTURE.md` and `/self-publish/README.md` for the canonical model.

## The manuscript: three steps + defaults

```ts
import { publishBook, type Manuscript } from '@css-bookends/self-publish';

const bordersManuscript: Manuscript<Raw, Store, Out, Cfg, Opts> = {
  defaults: { /* config defaults */ },
  input:   (raw, cfg) => store,    // input step
  storage: (store, cfg) => store,  // storage step
  output:  (store, cfg) => result, // output step (result exposes .css())
};

export const publishBookBorders = publishBook(bordersManuscript);
```

## The three steps

1. **input** : accept many raw shapes (shorthand, per-side, complex) and *parse*
   them into the canonical store. Parse, do not validate: the store cannot
   represent an invalid state, so storage and output never re-check.
2. **storage** : normalize the canonical store (apply defaults, merge shorthands,
   resolve). One standardized shape, whatever the input looked like.
3. **output** : render the store into the book's result, which exposes `.css()`.
   The output variant (longform vs shorthand, etc.) is chosen by config.

## Rules

- **Compiler-agnostic (hard rule).** No core package imports a CSS compiler
  (vanilla-extract etc.). Steps return plain data and strings; tools consume them.
  Examples MAY use a compiler, as a devDependency only.
- **The factory is the public surface.** Export `publishBook<Name>` (plus value
  builders / composition helpers where useful), never a pre-made instance as the
  consumer entry. See `AGENTS.md`.
- **Steps are overridable and composable.** A re-publish can replace a step
  (`publishBookBorders({ storage: mine })`), wrap it onion-style
  (`{ wrap: { output: (base) => (s, c) => base(s, c) } }`), reuse another book's
  store (`book.store`), or re-publish the whole manuscript
  (`publishBook(book.manuscript)({ ... })`).
- **Types, tests, notes.** Put the input contract and store/output types in
  `src/types.ts` (lock big input designs in a `design.md`, see `books/borders/`).
  Bring a runtime test under `tests/runtime/`. Add a `notes.md` of known debt.

## Quality bars (the how-to skills)

Four skills codify the quality every book must hit; consult the matching one when you
build that part:

- **`output-shape`** - the `.css()` terminal, typed variant objects, branded +
  immutable output.
- **`smart-factory`** - the factory, smart default config, library-agnostic public
  surface, strictness + fail-fast errors.
- **`type-hardening`** - a runtime restriction must also brand the TS type, at both the
  input and output edges.
- **`spec-faithful`** - cover the full `-space.md` surface, pass special keywords
  through verbatim, do not gate output.

See also `using-calipers` (measurements) and `space-doc` (the value-surface doc).

## Where books depend

A book peer-depends on `@css-bookends/self-publish`, `@css-bookends/css-calipers`,
and any lexicon it consumes (`workspace:^`), plus the same as workspace
devDependencies (`workspace:*`). self-publish itself has no runtime dependencies.
