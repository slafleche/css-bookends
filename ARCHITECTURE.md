# Architecture: the factory model

How every helper in CSS-Bookends is structured and consumed. This is the design
all lexicons/books are being reworked toward.

## Goal: a stable public surface that absorbs internal change

Helpers get rewritten over time, sources, imports, dependencies, even which
library backs them (e.g. colours moving from chroma-js to culori). The point of
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

`shelfFactory()` wires up every helper with sensible defaults.

- **Everything, all defaults:** `const shelf = shelfFactory()` returns all helpers
  preconfigured. Re-export them from one file and the project imports its helpers
  from there.
- **One helper at a time:** export a single helper from the shelf, or call that
  helper's own factory directly, when you only want one.
- **Multiple instances:** call a helper's factory more than once with different
  config to run differently-defaulted instances side by side.

## 3. Why the factory export is mandatory

The file where you call `shelfFactory()` / the per-helper factories and re-export
the results is the **stable footprint**. When the library changes internally,
only that one file might need updating; every consumer keeps its existing imports
untouched. That seam is what makes large refactors safe, and why the factory
export is required rather than optional.

## The 3 mandatory pages of every helper

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

These three pages are mandatory for every helper, and the factory (above) is how
their defaults are set.

## The pages are overridable and composable

The three pages are not a monolith. Each is an independently replaceable unit, and
the factory lets you override any of them while keeping the rest:

- Override just the **input** (accept a different or extra set of shapes), keeping
  the standard internal store and output.
- Override the **internal store** and/or **output**, while reusing an existing
  helper's input layer.
- Compose pages across helpers, e.g. reuse the borders input parsing, plug in your
  own internal model and your own renderer.

This works because the seams between the pages are explicit contracts:

- **input** maps the accepted shapes into the internal store,
- **internal store** is the canonical shape both sides agree on,
- **output** consumes the internal store and renders CSS.

Overriding one page means satisfying the contract at its edges; the factory takes
optional per-page overrides and uses the defaults for whatever you do not replace.
The exact contract shapes (what input produces, the store's schema, the output
signature) get nailed down with the borders reference implementation, which is the
first helper built fully to this model.
