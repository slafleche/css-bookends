# css-bookends

Composable, typed “bookends” around plain CSS.

> Status: early design / placeholder package. The concepts below describe the intended direction; the current npm package only exports a simple placeholder function.

## Vision

We still don't have proper CSS frameworks. What we call frameworks today are mostly vocabularies and methodologies. What every other ecosystem has, and CSS lacks, is a contract a compiler can enforce: typed input in, defined output out.

CSS-Bookends is an attempt at that contract, built as a set of small, focused, opt-in "books". Each book (measurement via css-calipers, then spacing, borders, colour, and more) takes structured, typed tokens and emits plain, inspectable CSS. How you compose them is up to you.

The shape is deliberate: strict at the edges (typed inputs, valid emission), loose in the middle (composition, file layout, and how far you take it are yours), and faithful to the full CSS spec rather than a curated subset. Every book is standalone and independently installable, so you can adopt one, several, or none alongside whatever you already use.

## Concepts

CSS frameworks are usually class libraries with predefined styles. That’s not what this is. Conceptually, it is closer to backend rendering or compiler pipelines that validate inputs and generate HTML than to utility-first or class-based CSS frameworks. Validated, typed inputs go in. Plain CSS comes out.

Instead of authoring strings like "20px", values are represented as structured objects (css-calipers) and passed through domain helper APIs such as borders, margins, and padding. These helpers render plain CSS through a standard .css() call.

What happens in between, the “books” section, is intentionally left open. How you compose or layer those helpers is up to you.

CSS remains the final specification. This system does not replace it, restrict it, or redefine it. It enforces correctness at authoring time and emits fully inspectable CSS at build time.

## Installation

```bash
npm install @css-bookends/css-bookends
# or
pnpm add @css-bookends/css-bookends
```

## Usage (placeholder)

The current package only exports a minimal placeholder function:

```js
import { cssBookends } from "@css-bookends/css-bookends";

cssBookends(); // 'css-bookends placeholder package'
```

## Links

- css-bookends: https://github.com/slafleche/css-bookends · https://www.npmjs.com/package/@css-bookends/css-bookends
- css-calipers: https://github.com/slafleche/css-calipers · https://www.npmjs.com/org/css-calipers
