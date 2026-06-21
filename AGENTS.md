# AGENTS.md

Guidance for agents working in CSS-Bookends. See `ARCHITECTURE.md` for the full
factory + book model, and each package's `design.md` / `notes.md` for specifics.

## Global rules

### Consume helpers from a factory, never import directly (absolute)

Every helper (lexicon or book) is produced by a factory. Consume the factory, or
an instance the composition root made from it, never the raw helper/value-function
imported straight from its module.

- **Factory naming: `bookPress<BookName>`.** A book's factory is named with the
  `bookPress` prefix plus the book's name, e.g. `bookPressColours`,
  `bookPressBorders`, `bookPressShadows`. The metaphor: the `bookpress` package's
  `bookPress` presses a book from its press. Do NOT use `make*` / `create*` for a
  book factory.

There are two levels of composition, both of which call factories and re-export
configured instances:

- **Per-package default instance.** Each helper package ships a file that calls its
  own factory once with the built-in defaults and exports the configured instance
  (e.g. `lexicons/colours/src/default.ts` exports `colours = bookPressColours()`). Import
  that instance, not the raw helper. This file is the helper's stable footprint:
  rewire it and every call site follows.
- **The shelf (aggregate root).** Importing `@css-bookends/shelf` gives you a file
  that pulls in every helper's default instance and re-exports them, so one import
  gets the whole preconfigured set. It does NOT flat re-export raw helpers, so the
  raw value-helper is not reachable through it (e.g. `colours` and `bookPressColours` are
  exposed; `color()` is not).
- **Call sites use the instance** (`colours('#fff').css()`), from the shelf or the
  package's default file, or call the factory for a differently-configured one
  (`bookPressColours({ ... })`).
- **Never reach past the factory** to import the underlying helper, even when it is
  exported from its own package for the factory's use.

Why: the factory is the override seam. It lets you rewrite any page (input,
storage, output) or the whole press, and swap internals (libraries, sources) with
zero changes at call sites (see `bookpress/composition.md` and `bookPress`). A direct
import bypasses that seam and freezes every call site to one implementation, which
is exactly what this architecture exists to prevent.

### Output is always `.css()` (absolute)

Every helper in CSS-Bookends, lexicon or book, renders its final output through a
single `.css()` terminal. This is universal and not negotiable per helper.

- **`.css()` is the only renderer.** Rendering to a CSS string ALWAYS happens
  through `.css()`. No method may return a rendered string per format (no
  `.hex(): string`, `.toLong(): string`, etc.).
- **The variant is a typed object, never a magic string.** Each book exports a
  named preset namespace of typed format objects (e.g. colours `colorFormats.hex`,
  `colorFormats.rgbLegacy`; a true book would have `borderFormats.long`). The
  format type is a discriminated union, so each variant can carry its own typed
  options. Do NOT accept a bare string literal as the format.
- **The variant is chosen by factory config.** The output format is set at factory
  time via the press config (`output: colorFormats.hex`). `.css()` with no
  argument renders the configured variant.
- **Two ways to pick a one-off variant, both ending in `.css()`:**
  - **As an argument:** `colour(x).css(colorFormats.hex)`.
  - **As a format selector:** a method like `colour(x).hex()` that returns the
    navigable result configured to that format (it does NOT render), so you still
    finish with `.css()`: `colour(x).hex().css()`. Selectors return the helper's
    resolved type, never a string, and the chosen format persists through later
    modifications. This is the line that keeps selectors compatible with the rule.
  The configured default still wins when no override is given.
- **Intermediate values may still be navigated** (drill into a resolved result,
  chain modifications), but the moment you render to CSS, it goes through `.css()`.

Why: a single, predictable output seam is what lets the internals of any helper be
rewritten without touching call sites (the whole point of the factory model). It
also keeps every helper consistent, so a consumer never has to learn a different
render method per package.

Examples:

```ts
borders(spec).css();                       // configured variant per factory config
colour('#3366cc').css();                   // configured format (default colorFormats.css)
colour('#3366cc').css(colorFormats.hex);   // one-off override (argument) -> '#3366cc'
colour('#3366cc').hex().css();             // one-off override (selector) -> '#3366cc'
colour('red').darken(0.2).css();           // navigate/modify, then render via .css()
```

### The typesetter is a code generator, not a runtime helper (planned)

A third construct is planned (not built yet): the **typesetter** (see
`ARCHITECTURE.md`, `README.md`, and `design-tokens.md`). It converts a DTCG
design-token document into typed lexicon vars at build time. It is not a runtime
helper, so the two rules above do not apply to it directly:

- It is **not consumed from a factory** and is not pressed by `bookPress`; it is an
  on-demand script the dev runs when the design updates.
- It **does not render `.css()`**. Its output is TS source: `export const`
  declarations whose values are lexicon-factory calls (`m()`, `color()`). The
  factory + `.css()` rules are upheld downstream, in that generated code, because
  the generated vars are produced by the lexicon factories and rendered by the
  consumer through `.css()` like any other value.

When the typesetter is built, keep its conversion engine fixed and its routing /
naming / output-shape behavior configurable (see `design-tokens.md`).

### Format, lint, and type-check every file you touch (absolute)

Any code an agent writes or edits MUST be run through the repo's formatter,
linter, and type-checker before the work is considered done. Do not hand back
unformatted, unlinted, or type-erroring code.

- **Format with Prettier:** `pnpm format` from the repo root. Markdown is
  intentionally Prettier-ignored (hand-tuned tables and aligned fenced-code
  comments), so never reformat `.md` files.
- **Lint with ESLint, in the owning package:** flat config does not cascade and
  type-aware linting needs the package as its cwd, so run e.g.
  `pnpm --filter @css-bookends/<name> exec eslint . --fix` and resolve anything
  not auto-fixable. All packages share `@css-bookends/eslint-config`; never add
  per-package lint plugins or a per-package Prettier config.
- **Type-check with `tsc`, in the owning package:**
  `pnpm --filter @css-bookends/<name> exec tsc -p tsconfig.json --noEmit` (the
  package's `test:tsc`). It checks the whole project, not a single file, so run
  it for every package you changed and fix all errors.

Tooling scripts use `.mts` (e.g. `scripts/emit-esm-package.mts`) and run under
plain `node`, which requires **Node >= 24** to build (see `.nvmrc` / root
`engines`).

A `husky` pre-commit hook runs `lint-staged` on staged files as a backstop:
per-package ESLint `--fix`, then per-package `tsc --noEmit`, then Prettier. It
is a safety net, not a substitute: leave the tree already clean rather than
relying on the hook.
