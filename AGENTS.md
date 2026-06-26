# AGENTS.md

Guidance for agents working in CSS-Bookends. See `ARCHITECTURE.md` for the full
factory + book model, and each package's `design.md` / `notes.md` for specifics.

## Architecture: the three layers (canonical, ABSOLUTE)

The same statement lives in `.claude/CLAUDE.md`, the package READMEs, and the skills.
Keep them in sync. The stack is three strictly-separated layers, each with one job:

1. **css-calipers (Layer 1), typed CSS input PRIMITIVES only.** Fills the gap where
   `csstype` is lacking: typed, build-time-validated CSS input values (`m`, `r`, `i`,
   `f`, `color`). Usable STANDALONE, for someone who wants only typed CSS inputs and no
   helpers at all. NO helpers, NO books, no `publishBook` engine, ever.
2. **css-bookends (Layer 2), the helpers (books) that consume the primitives.** EVERY
   helper is a book (per-property: opacity, zIndex, ...; composed: borders, shadows,
   margin, ...). The shelf is the full bundle of every active book; the typesetter
   ingests DTCG design tokens; gilding is the output-edge finisher. Books consume
   calipers; calipers never depends on a book.
3. **css-squire (Layer 3, TBD), the opinionated framework on top.** Built on the steady
   calipers + bookends foundation, adaptable per project (you could in theory rebuild
   Tailwind or Bootstrap on top of it). Not built yet; nothing depends on it.

Known debt: the per-property helpers in `lexicons/calipers/src/css-values/` currently
live in calipers, violating Layer 1. They must be extracted into the books layer. Do
NOT add further helpers to calipers.

## Global rules

### Consume helpers from a factory, never import directly (absolute)

Every helper (lexicon or book) is produced by a factory. Consume the factory, or
an instance the composition root made from it, never the raw helper/value-function
imported straight from its module.

- **Factory naming: `publishBook<BookName>`.** A book's factory is named with the
  `publishBook` prefix plus the book's name, e.g. `publishBookColor`,
  `publishBookBorders`, `publishBookShadows`. The engine (`@css-bookends/self-publish`)
  exposes `publishBook`, which binds a book from its manuscript. Do NOT use
  `make*` / `create*` for a book factory.

The public surface of a package is its factory; there is no per-package default instance.

- **A book package exports its `publishBook<Name>` factory** (plus value builders and
  composition helpers where useful, e.g. `anchorSize`, or margin/padding's `parse*`/`store*`),
  never a pre-made instance as the consumer entry. A consumer binds a book once
  (`const color = publishBookColor()`) and calls it.
- **The shelf (aggregate root).** Importing `@css-bookends/shelf` gives you
  `publishShelf(config?)`, which returns every book bound in one object. It does NOT
  re-export raw helpers, so a raw value-helper is not reachable through it.
- **Call sites bind, then call** (`const color = publishBookColor(); color('#fff').css()`),
  or pull a bound book off `publishShelf()`. Pass config at bind time
  (`publishBookColor({ config })`).
- **Never reach past the factory** to import the underlying value-helper as the consumer
  entry, even when it is exported from its own package for the factory's use.
- **Exception: `@css-bookends/css-calipers`** (a lexicon with a different structure) is
  consumed directly (`m()`), not via a `publishBook` factory.

Why: the factory is the override seam. It lets you rewrite any step (input, storage,
output), wrap a step (onion-style), or replace the whole manuscript, and swap internals
(libraries, sources) with zero changes at call sites (see `self-publish/composition.md`
and `publishBook`). A direct import bypasses that seam and freezes every call site to one
implementation, which is exactly what this architecture exists to prevent.

### Output is always `.css()` (absolute)

Every helper in CSS-Bookends, lexicon or book, renders its final output through a
single `.css()` terminal. This is universal and not negotiable per helper.

- **`.css()` is the only renderer.** Rendering to a CSS string ALWAYS happens
  through `.css()`. No method may return a rendered string per format (no
  `.hex(): string`, `.toLong(): string`, etc.).
- **The variant is a typed object, never a magic string.** Each book exports a
  named preset namespace of typed format objects (e.g. color's `colorFormats.hex`,
  `colorFormats.rgb`; a true book would have `borderFormats.long`). The
  format type is a discriminated union, so each variant can carry its own typed
  options. Do NOT accept a bare string literal as the format.
- **The variant is chosen by factory config.** The output format is set at factory
  time via the manuscript config (`output: colorFormats.hex`). `.css()` with no
  argument renders the configured variant.
- **One way to pick a one-off variant, ending in `.css()`:** a format selector, never
  an argument into `.css()` (`.css()` itself takes no argument).
  - **As a named format selector:** a method like `color(x).hex()` that returns the
    navigable result configured to that format (it does NOT render), so you still
    finish with `.css()`: `color(x).hex().css()`. Selectors return the helper's
    resolved type, never a string, and the chosen format persists through later
    modifications. This is the line that keeps selectors compatible with the rule.
  - **For a custom format or a priority list:** `color(x).formatAs(descriptor).css()`
    sets the one-off format, then renders through `.css()`.
  The configured default still wins when no override is given.
- **Intermediate values may still be navigated** (drill into a resolved result,
  chain modifications), but the moment you render to CSS, it goes through `.css()`.

Why: a single, predictable output seam is what lets the internals of any helper be
rewritten without touching call sites (the whole point of the factory model). It
also keeps every helper consistent, so a consumer never has to learn a different
render method per package.

Examples:

```ts
// (color is a book bound once: `const color = publishBookColor()`)
borders(spec).css();                       // configured variant per factory config
color('#3366cc').css();                    // configured format (default colorFormats.rgba)
color('#3366cc').hex().css();              // one-off override (selector) -> '#3366cc'
color('#3366cc').formatAs(colorFormats.hex).css();  // one-off override (custom/list) -> '#3366cc'
color('red').darken(0.2).css();            // navigate/modify, then render via .css()
```

### The typesetter is a code generator, not a runtime helper (planned)

A third construct is planned (not built yet): the **typesetter** (see
`ARCHITECTURE.md`, `README.md`, and `design-tokens.md`). It converts a DTCG
design-token document into typed lexicon vars at build time. It is not a runtime
helper, so the two rules above do not apply to it directly:

- It is **not consumed from a factory** and is not bound by `publishBook`; it is an
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
