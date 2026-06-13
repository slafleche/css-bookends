---
name: authoring-a-book
description: How to build or rework a CSS-Bookends book with bookpress, the bookPress, the press, and the three pages (input, storage, output). Use whenever adding or changing a book/helper in this repo.
---

# authoring-a-book

A **book** is a workable library for one CSS concern (borders, shadows, spacing).
Every book is stamped out by the **bookPress** from `@css-bookends/bookpress`, from a
**press** definition made of three **pages**. See `/ARCHITECTURE.md` and
`/bookpress/README.md` for the canonical model.

## The press: three pages + defaults

```ts
import { bookPress, type Press } from '@css-bookends/bookpress';

const press: Press<Raw, Store, Out, Cfg, Opts> = {
  defaults: { /* config defaults */ },
  input:   (raw, cfg) => store,    // page 1
  storage: (store, cfg) => store,  // page 2
  outputs: { long, short },        // page 3 (one or many renderers)
  default: 'short',
};

export const makeBorders = bookPress(press);
```

## The three pages

1. **input** : accept many raw shapes (shorthand, per-side, complex) and *parse*
   them into the canonical store. Parse, do not validate: the store cannot
   represent an invalid state, so storage and output never re-check.
2. **storage** : normalize the canonical store (apply defaults, merge shorthands,
   resolve). One standardized shape, whatever the input looked like.
3. **output(s)** : render the store to CSS. There may be several valid renderings
   (longform vs shorthand); a bare call uses `default`.

## Rules

- **Compiler-agnostic (hard rule).** No core package imports a CSS compiler
  (vanilla-extract etc.). Pages return plain data and strings; tools consume them.
  Examples MAY use a compiler, as a devDependency only.
- **Pages are overridable and composable.** The bookPress can rewrite any page or the
  whole press: `makeBorders({ storage: mine })`, or reuse another book's pages via
  `book.store` / `book.outputs`, or `bookPress(book.press)({ ... })`.
- **Types, tests, notes.** Put the input contract and store/output types in
  `src/types.ts` (lock big input designs in a `design.md`, see `books/borders/`).
  Bring a runtime test under `tests/runtime/`. Add a `notes.md` of known debt.

## Where books depend

A book peer-depends on `@css-bookends/css-calipers` and any lexicon it consumes
(`workspace:^`), plus the same as a workspace devDependency (`workspace:*`).
bookpress itself has no runtime dependencies.
