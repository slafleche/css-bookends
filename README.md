# CSS-Bookends

**Typed tokens in. Plain CSS out.**  
The contract CSS never had, as a set of small, opt-in libraries you adopt one at a time.

> Status: early and experimental (0.x). The measurement layer, `css-calipers`, is
> stable and headed to 1.0; the rest is taking shape.

## Vision

> This project grew out of a blog post:
> [We still don't have proper CSS frameworks](https://dev.to/slafleche/we-still-dont-have-proper-css-frameworks-18dk).

We still don't have proper CSS frameworks. What we call frameworks today are
utility libraries, class-naming conventions, and methodologies dressed up in
framework branding. What every other ecosystem has, and CSS lacks, is **typed
input, defined output, a contract a compiler can actually enforce**.

Traditional CSS frameworks put their opinions in the **middle**. They hand you a
vocabulary and a way to compose it, prescribing how you author and assemble your
styles. But the edges stay loose: the values you feed in and the CSS that comes
out are still unchecked strings, so an off-scale number or a mistyped token ships
without complaint.

CSS-Bookends does the opposite. It is **opinionated at the edges** (typed tokens
in, valid CSS out) and **loose in the middle** (how you compose, layer, and
organize is entirely yours). Each piece takes structured, typed tokens and emits
plain, inspectable CSS. Values stay opaque through composition and only become
strings at the very edge, so mistakes surface where you can see them rather than
shipping silently:

```ts
import { m } from "css-calipers";

const paddingBase = m(16);     // 16px
const rotation = m(45, "deg"); // 45deg

paddingBase.add(rotation);     // throws: cannot add px and deg
paddingBase.add(m(8)).css();   // "24px"
```

It also stays faithful to the full CSS spec. Many frameworks only let you reach
for a curated subset of what CSS can do, so anything outside their vocabulary or
scale is awkward or impossible to express, even when it would be perfectly valid
CSS. CSS-Bookends does not gate the output: if CSS allows it, you can emit it.

## Architecture: three layers

The stack is three strictly-separated layers, each with one job (the canonical
statement lives in `.claude/CLAUDE.md` and `AGENTS.md`):

1. **css-calipers (Layer 1), the typed CSS input PRIMITIVES.** It fills the gap
   where `csstype` is lacking: typed, build-time-validated CSS input values (`m`,
   `r`, `i`, `f`, `color`). It is usable **standalone**, for someone who wants only
   typed CSS inputs and no helpers at all. No helpers, no books, ever.
2. **css-bookends (Layer 2), the helpers (books) that consume the primitives.**
   Every helper is a book; the compendium is the full bundle of every active book; the
   typesetter ingests DTCG design tokens; gilding is the output-edge finisher.
   Books consume calipers; calipers never depends on a book.
3. **css-squire (Layer 3, TBD), the opinionated framework on top.** Built on the
   steady calipers + bookends foundation, adaptable per project (you could in theory
   rebuild Tailwind or Bootstrap on top of it). Not built yet; nothing depends on it.

Consumption is one-way: calipers -> books -> squire. Known debt: the per-property
helpers in `lexicons/calipers/src/css-values/` currently live in calipers,
violating Layer 1, and must move to the books layer.

## Lexicons and books

CSS-Bookends is split into two kinds of package:

- **Lexicons** are the foundational vocabularies. A lexicon defines typed values
  and the operations on them, and depends on little or nothing else.
  `css-calipers` (measurement) is a lexicon; `color` and `spacing` are too.
  Lexicons can build on one another (a `spacing` lexicon builds on `css-calipers`).
- **Books** are the standalone helper libraries built on top of one or more
  lexicons. A book takes typed tokens and emits plain CSS for a single concern.
  `borders`, `shadow`, and `margins` will be. (`media-queries` was an early book;
  it has been pulled from the active workspace pending rework.)

A lexicon is the vocabulary; a book is written using it. Every package, lexicon
or book, is independently installable and pulls in only what it actually depends
on. The umbrella is organizational, never a bundle you are forced to take whole.

A third kind of construct is planned (not built yet): the **typesetter**. It sits
in front of the books at the input edge and converts a design-token document (the
W3C Design Tokens / DTCG format) into typed lexicon vars (`m()`, `color()`, ...)
that you then feed to the books. See `design-tokens.md` for the boundary and the
format reference.

Every package publishes under the `@css-bookends/*` scope, lexicons and books
alike (for example `@css-bookends/css-calipers` and `@css-bookends/compendium`).

## What is available today

- **`@css-bookends/css-calipers`** — the measurement lexicon and the foundation
  most other pieces build on. Stable, headed to 1.0.
  [repo](https://github.com/slafleche/css-calipers) ·
  [npm](https://www.npmjs.com/package/@css-bookends/css-calipers)

> **`@css-bookends/media-queries`** has been removed from the active workspace,
> pending rework. It remains in git history and in its prior published versions.

More lexicons (`spacing`, `color`) and books (`borders`, `shadows`, `margin`,
`padding`) are being brought in.

## Concepts

CSS frameworks are usually class libraries with predefined styles. That is not
what this is. Conceptually it is closer to compiler pipelines that validate
inputs and generate output than to utility-first or class-based CSS frameworks.
Validated, typed inputs go in. Plain CSS comes out.

Instead of authoring strings like `"20px"`, values are represented as structured
objects (via the `css-calipers` lexicon) and passed through book APIs such as
borders, margins, and media queries. These render plain CSS through a standard
`.css()` call or a normalized object.

CSS remains the final specification. This system does not replace it, restrict
it, or redefine it. It enforces correctness at authoring time and emits fully
inspectable CSS.

## Wrapping at the edges, not reinventing

The metaphors (lexicon, book, typesetter, gilding, compendium) name one consistent
architecture. The naming is not just for whimsy: it is because the idea is that
everything underneath is swappable. Each name marks a ROLE and hides the library
currently filling it (you import `color()`, not `culori`; the finisher is `gilding`,
not Lightning CSS), so the engine can change without moving your call sites. Two
things here are genuinely different, and neither is a rename:

1. **The typed authoring contract.** You compose CSS values as typed, branded,
   autocompleting TypeScript that catches mistakes before they ship, and plain CSS
   comes out. That seam, typed in and plain CSS out, is what utility libraries,
   naming methodologies, and post-processors do not give you.
2. **Deliberate wrapping at the edges, credited plainly.** Where a mature tool already
   solves a problem, we wrap it instead of reinventing it, and we say so. The
   typesetter (planned) wraps a W3C Design Tokens parser at the input edge;
   **gilding** wraps [Lightning CSS](https://lightningcss.dev/) at the output edge to
   complete browser compatibility (older-browser fallbacks and vendor prefixes). We do
   not reimplement or take credit for their work. What CSS-Bookends adds is the
   coherent typed system around those edges, one factory model and one `.css()` output
   with swappable internals, not the wrapped tool's transformation.

## Terminology

The architecture terms (lexicon, book, the three steps, manuscript, `publishBook` /
`publishBook<Name>`, compendium / `publishCompendium()`, `.css()`) live in one place. See
**[`ARCHITECTURE.md`](./ARCHITECTURE.md)** for the model and the canonical glossary, and
`AGENTS.md` for the rules that enforce them.

## Factories (the override seam)

Every book is consumed through its factory, never imported raw, because the factory is the configurable path and the override seam: it lets you rewrite or wrap any step (input, storage, output) onion-style, or swap the internals, with zero changes at call sites. A per-book package exports its `publishBook<Name>` factory and no pre-made instance, so a consumer binds it once (`const color = publishBookColor()`) and calls it. Because you bind once in your own module and import the helper from there, a major rewrite of the library's internal paths changes that one file, not the hundreds or thousands of call sites across your project. Each factory call also returns its own independent instance, so you can run several configurations of the same book at once with no global state to collide: a strict opacity beside a clamping one, or two colour books with different output formats, with no cascade or shared global state to fight (each is a value in scope, not a stylesheet competing in the cascade). The compendium is the bundle's factory: `publishCompendium` is exported as the package's default export, a bare `publishCompendium()` binds every active book at its own defaults, and passing a master `CompendiumConfig` (one optional key per book) configures any subset. So all of that power is opt-in: if you do not want to configure anything, `publishCompendium()` with no arguments is the zero-config path, every book at its defaults, no wiring required.

## Installation

Install only the pieces you want; nothing pulls in the rest of the umbrella.

```bash
# the measurement lexicon
npm install @css-bookends/css-calipers

# a book installs the same way and brings in css-calipers as its dependency:
# npm install @css-bookends/<book>
```

Or take the whole compendium in one package, which re-exports every lexicon and
book:

```bash
npm install @css-bookends/compendium
```

## Repository layout

This is a pnpm monorepo and the source of truth for every package. Established
packages are mirrored out to their own standalone repositories (for example
`css-calipers`), which keep their URL, stars, and issues.

```
lexicons/     foundational vocabularies (css-calipers, ...)
books/        standalone helper libraries (borders, shadows, ...)
```

## Support

This is a solo, early-stage project. If the direction resonates, you can
[buy me a coffee](https://buymeacoffee.com/slafleche) to support continued work.

<a href="https://www.buymeacoffee.com/slafleche" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="48"></a>
