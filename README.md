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

## Lexicons and books

CSS-Bookends is split into two kinds of package:

- **Lexicons** are the foundational vocabularies. A lexicon defines typed values
  and the operations on them, and depends on little or nothing else.
  `css-calipers` (measurement) is a lexicon; `colours` and `spacing` will be too.
  Lexicons can build on one another (a `spacing` lexicon builds on `css-calipers`).
- **Books** are the standalone helper libraries built on top of one or more
  lexicons. A book takes typed tokens and emits plain CSS for a single concern.
  `@css-bookends/media-queries` is a book; `borders`, `shadow`, and `margins`
  will be.

A lexicon is the vocabulary; a book is written using it. Every package, lexicon
or book, is independently installable and pulls in only what it actually depends
on. The umbrella is organizational, never a bundle you are forced to take whole.

A third kind of construct is planned (not built yet): the **typesetter**. It sits
in front of the books at the input edge and converts a design-token document (the
W3C Design Tokens / DTCG format) into typed lexicon vars (`m()`, `color()`, ...)
that you then feed to the books. See `design-tokens.md` for the boundary and the
format reference.

Every package publishes under the `@css-bookends/*` scope, lexicons and books
alike (for example `@css-bookends/css-calipers` and `@css-bookends/media-queries`).

## What is available today

- **`@css-bookends/css-calipers`** — the measurement lexicon and the foundation
  most other pieces build on. Stable, headed to 1.0.
  [repo](https://github.com/slafleche/css-calipers) ·
  [npm](https://www.npmjs.com/package/@css-bookends/css-calipers)
- **`@css-bookends/media-queries`** — typed, unit-safe media query strings, built
  on `@css-bookends/css-calipers`. Experimental 0.x.

More lexicons (`spacing`, `colours`) and books (`borders`, `shadow`, `margins`)
are being brought in.

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

## Terminology

A glossary of the architecture terms used across this repo. See `ARCHITECTURE.md`
for the model and `AGENTS.md` for the rules that enforce these.

- **lexicon** : a foundational vocabulary, typed values and the operations on them
  (measurement, colours, spacing). Depends on little or nothing else.
- **book** : a standalone helper for one CSS concern (borders, shadows, ...),
  built on one or more lexicons. Takes typed tokens, emits plain CSS.
- **typesetter** (planned) : a construct that converts a DTCG design-token document
  into typed lexicon vars (`m()`, `color()`, ...) for the books to consume. It is
  the input-edge boundary for external design tokens; it generates vars, it is not
  a runtime helper and does not render CSS itself. See `design-tokens.md`.
- **page** : one of a book's three stages, `input` (accept many shapes) ->
  `storage` (one canonical internal shape) -> `output` (render to CSS).
- **press** : the definition of a book, its three pages plus config defaults.
- **bookPress** : the factory engine in `@css-bookends/bookpress` that stamps a book
  from a press, able to override any single page or the whole press.
- **bookpress** : the package that provides the `bookPress` and the press types.
- **`bookPress<BookName>`** : a book's factory function, named with the `bookPress`
  prefix (for example `bookPressColours`, `bookPressBorders`). The metaphor: the
  bookPress presses a book from its press. Calling it returns a configured book. This
  is the only sanctioned way to obtain a helper; the raw value-helper is never
  imported directly.
- **default instance** : each package calls its own factory once with the built-in
  defaults and exports the result (for example `colours`). Import this instance,
  not the raw helper.
- **shelf** (`@css-bookends/shelf`) : the aggregate composition root. It pulls in
  every book's default instance and re-exports them, so a single import gives you
  the whole preconfigured set.
- **`.css()`** : the single render terminal. Every helper renders its final output
  through `.css()`; the output variant is chosen by config or a typed format object
  (for example `colorFormats.hex`), never by a per-format render method.

## Installation

Install only the pieces you want; nothing pulls in the rest of the umbrella.

```bash
# the measurement lexicon
npm install @css-bookends/css-calipers

# a book (brings in css-calipers as its dependency)
npm install @css-bookends/media-queries
```

Or take the whole bookshelf in one package, which re-exports every lexicon and
book:

```bash
npm install @css-bookends/shelf
```

## Repository layout

This is a pnpm monorepo and the source of truth for every package. Established
packages are mirrored out to their own standalone repositories (for example
`css-calipers`), which keep their URL, stars, and issues.

```
lexicons/     foundational vocabularies (css-calipers, ...)
books/        standalone helper libraries (media-queries, ...)
```

## Support

This is a solo, early-stage project. If the direction resonates, you can
[buy me a coffee](https://buymeacoffee.com/slafleche) to support continued work.
