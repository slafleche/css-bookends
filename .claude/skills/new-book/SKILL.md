---
name: new-book
description: The order to build a new CSS-Bookends book - settle the INPUT first, then the internal STORAGE, then the OUTPUT, with passing unit tests gating each part. Use when starting a new book/helper or porting one in. For the model/contracts see authoring-a-book; for values see using-calipers.
---

# new-book

How to build a new book, in order. Each part is built and proven before the next.

**Three rules up front:**

- **Unit tests are required, not optional.** Every book ships tests under
  `tests/runtime/`. Each part below is "done" only when its unit tests pass.
- **Always real tests, never `it.todo` / `it.skip`.** For behavior you intend to
  build, write a real assertion first - it goes red for a good reason, then you
  implement to green. For behavior you do NOT support yet, still write a real test
  that asserts **today's** actual behavior (the method is absent, it throws, or it
  returns a fallback) - so the gap is surfaced and that test breaks the day someone
  implements the feature, forcing them to update it. A `todo` hides the gap; a real
  test names it. Work the full unit-test suite this way, unit tests first.
- **Gate:** do not start a part until the previous one is implemented and green.

This is the *order of work*. For the contracts (manuscript, the three steps, the
`.css()` rule, replace/wrap) see **authoring-a-book**; for measurement values see
**using-calipers**; to create the empty package first see **scaffold-package**.

## Prereq

Scaffold the package (**scaffold-package**) and decide book vs lexicon. You now
have an empty `src/` + `tests/runtime/`.

## Part 1 - INPUT (settle and lock first)

The input is the hardest part to change later, so nail it before anything else.

- Design the permissive public input: shorthands plus verbose / coordinate forms.
  If you are porting an existing helper, ground the shape in its real call sites
  first.
- Put the input contract in `src/types.ts`. For non-trivial input, lock the design
  in a `design.md` (see `books/borders/design.md`, which records the input as
  LOCKED before the rest was built).
- Write the input step `(raw, cfg) => store`. **Parse, do not validate** - the
  store cannot represent an invalid state, so storage and output never re-check.
- **Tests (required):** varied inputs (each shorthand, each verbose form, defaults)
  parse into the intended store.
- **Gate:** the input shape is locked and its tests pass.

## Part 2 - INTERNAL DATA (storage)

- Define the single canonical store shape - one standardized representation, no
  matter what the input looked like.
- Write the storage step `(store, cfg) => store`: normalize. Apply defaults, merge
  shorthands, resolve precedence.
- **Tests (required):** different inputs converge to the same canonical store;
  precedence and merge rules hold.
- **Gate:** the store is canonical and stable.

## Part 3 - OUTPUT

- Define the result type. It **must** expose `.css()` (the engine enforces
  `Out extends { css(): unknown }`). It may be richer: format selectors, chainable
  modifications, an escape hatch - see colours' `ResolvedColour`.
- Write the output step `(store, cfg, opts?) => result`.
- Wire the factory `publishBook<BookName>`. Consume the book only through that
  factory, never a raw helper (see AGENTS.md).
- **Tests (required):** rendering through `.css()` is correct; then output variants
  selected by config or `.css(format)` - never a render method per format.
- **Gate:** all three steps green.

## Finish

Per-book hygiene: input/store/result types in `src/types.ts`, big input designs in
`design.md`, the unit tests in `tests/runtime/`, known debt in `notes.md`. Follow
the rules in `AGENTS.md` (output is always `.css()`, never export a book directly,
factory named `publishBook<BookName>`).
