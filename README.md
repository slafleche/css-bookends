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
  `css-calipers` (measurement) is a lexicon; `color` and `spacing` are too.
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

## Terminology

The architecture terms (lexicon, book, the three steps, manuscript, `publishBook` /
`publishBook<Name>`, shelf / `publishShelf()`, `.css()`) live in one place. See
**[`ARCHITECTURE.md`](./ARCHITECTURE.md)** for the model and the canonical glossary, and
`AGENTS.md` for the rules that enforce them.

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

<a href="https://www.buymeacoffee.com/slafleche" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="48"></a>
