# Architecture: the factory model

How every helper in CSS-Bookends is structured and consumed. This is the design
all lexicons/books are being reworked toward.

## The three layers (canonical)

Above the factory model sits the layering of the stack itself. Three
strictly-separated layers, each with one job, consumed one-way
(calipers -> books -> squire). The canonical statement lives in `.claude/CLAUDE.md`
and `AGENTS.md`; keep this in sync with them.

1. **css-calipers (Layer 1), typed CSS input PRIMITIVES only.** Fills the gap where
   `csstype` is lacking: typed, build-time-validated CSS input values (`m`, `r`, `i`,
   `f`, `color`). Usable STANDALONE, with no helpers at all. No helpers, no books, no
   `publishBook` engine, ever.
2. **css-bookends (Layer 2), the helpers (books) that consume the primitives.** EVERY
   helper is a book; the shelf is the full bundle of every active book; the typesetter
   ingests DTCG design tokens; gilding is the output-edge finisher. Books consume
   calipers; calipers never depends on a book.
3. **css-squire (Layer 3, TBD), the opinionated framework on top.** Built on the steady
   calipers + bookends foundation, adaptable per project (you could in theory rebuild
   Tailwind or Bootstrap on top of it). Not built yet; nothing depends on it.

The consumption direction is one-way and never inverts: a lower layer never depends on
a higher one. Known debt: the per-property helpers in
`lexicons/calipers/src/css-values/` currently live in calipers, violating Layer 1, and
must be extracted into the books layer. No further helpers go into calipers.

## Vocabulary

- **lexicon** : primitives for CSS use (calipers, color, spacing). The raw
  vocabulary every other package builds on.
- **book** : a workable library for one CSS concern (borders, shadows, ...),
  built by combining three steps.
- **typesetter** (planned, not built yet) : a construct that converts a DTCG
  design-token document into typed lexicon vars (`m()`, `color()`, ...) for the
  books to consume. It is neither a lexicon nor a book: it sits at the input edge,
  it is an on-demand code generator (not a runtime helper), and it does not render
  CSS. See `design-tokens.md` for the boundary and format reference.
- **step** : one of a book's three stages, `input` -> `storage` -> `output`.
- **manuscript** : the definition of a book, its three steps plus config defaults.
- **publishBook** : the factory engine (in `@css-bookends/self-publish`) that binds a
  book from a manuscript, able to rewrite any single step (or wrap it, onion-style)
  or the whole manuscript. This is the "factory" the sections below describe.
- **self-publish** : the package that provides `publishBook` and the manuscript types.
- **`publishBook<BookName>`** : a book's factory function, named with the `publishBook`
  prefix (for example `publishBookColor`, `publishBookBorders`, `publishBookMargin`).
  Calling it returns a configured book. This is the only sanctioned way to obtain a
  helper; the raw value-helper is never imported directly.
- **shelf** + **`publishShelf()`** : the aggregate composition root. `publishShelf(config?)`
  returns every book bound, in one object (no pre-built default instance is exported).
- **`.css()`** : the single render terminal required on every book's result.

**The never-export rule:** a package's public surface is its `publishBook<Name>` factory
(and `publishShelf()` for the shelf), never a raw value-helper or a pre-made instance. The
one exception is `@css-bookends/css-calipers` (a lexicon with a different structure). See
`AGENTS.md` for the rule as enforced; this doc is the canonical glossary that `README.md`
links to.

## Goal: a stable public surface that absorbs internal change

Helpers get rewritten over time, sources, imports, dependencies, even which
library backs them (e.g. color moving from chroma-js to culori). The point of
this model is that none of that reaches the rest of a project. By requiring every
helper to be produced by a **factory** and consumed through a single **export
layer**, internal churn stays contained: call sites keep importing the same
helper the same way even when the implementation underneath is replaced.

## 1. Every helper comes from a factory

Each helper is created by a factory that takes its config / defaults and returns
the ready-to-use helper. Behavior is configured at factory time, not baked into
module-level exports.

Precedent: `css-calipers` already works this way via `createCalipers({ errorConfig })`.
This model generalizes that to every helper.

## 2. The shelf factory (the composition root)

`publishShelf()` wires up every helper with sensible defaults.

- **Everything, all defaults:** `const shelf = publishShelf()` returns all helpers
  preconfigured. Re-export them from one file and the project imports its helpers
  from there.
- **One helper at a time:** export a single helper from the shelf, or call that
  helper's own factory directly, when you only want one.
- **Multiple instances:** call a helper's factory more than once with different
  config to run differently-defaulted instances side by side.

## 3. Why the factory export is mandatory

The file where you call `publishShelf()` / the per-helper factories and re-export
the results is the **stable footprint**. When the library changes internally,
only that one file might need updating; every consumer keeps its existing imports
untouched. That seam is what makes large refactors safe, and why the factory
export is required rather than optional.

## The 3 mandatory steps of every helper

Every helper is a pipeline: **flexible in, canonical in the middle, configurable
out.** This maps to the umbrella thesis, loose at the input edge, strict on the
output edge, with a standardized core in between.

### 1. Input — accept many shapes

The public input is permissive: shorthand forms, verbose/complex forms, and
everything between all map to the same concept. Callers express intent however is
natural for them. (See `borders` for how far this can go, it is messy, but it
shows the range of shapes a single concern can accept.)

### 2. Internal storage — one standardized shape

However varied the input, the helper normalizes it into a **single canonical
internal representation**. All logic operates on this standardized store, never on
the raw input. This is the seam that keeps a helper coherent as its accepted
inputs grow, and what lets the factory and output layers stay simple.

### 3. Output — configurable, always valid CSS

Rendering the standardized store to CSS is configurable: long-form vs shorthand
output and other display options. Configuration comes from the **factory
defaults**, or from **extra options / functions at output time**. Whatever the
options, the output is always standard, valid CSS.

These three steps are mandatory for every helper, and the factory (above) is how
their defaults are set.

## The steps are overridable and composable

The three steps are not a monolith. Each is an independently replaceable unit, and
the factory lets you override any of them while keeping the rest:

- Override just the **input** (accept a different or extra set of shapes), keeping
  the standard internal store and output.
- Override the **internal store** and/or **output**, while reusing an existing
  helper's input layer.
- Compose steps across helpers, e.g. reuse the borders input parsing, plug in your
  own internal model and your own renderer.

This works because the seams between the steps are explicit contracts:

- **input** maps the accepted shapes into the internal store,
- **internal store** is the canonical shape both sides agree on,
- **output** consumes the internal store and renders CSS.

Overriding one step means satisfying the contract at its edges; the factory takes
optional per-step overrides and uses the defaults for whatever you do not replace.
The exact contract shapes (what input produces, the store's schema, the output
signature) get nailed down with the borders reference implementation, which is the
first helper built fully to this model.
