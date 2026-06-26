# CSS-Calipers

[![npm](https://img.shields.io/npm/v/@css-bookends/css-calipers.svg)](https://www.npmjs.com/package/@css-bookends/css-calipers)
[![types](https://img.shields.io/npm/types/@css-bookends/css-calipers.svg)](https://www.npmjs.com/package/@css-bookends/css-calipers)
[![license](https://img.shields.io/npm/l/@css-bookends/css-calipers.svg)](./LICENSE.txt)

**CSS is code. Treat it that way.**
The missing typed inputs for CSS: build-time-validated measurements, ratios, integers, and floats, with no surprises at runtime.

```ts
// Before: pull the number AND the unit apart, do the math, glue them back
const match = base.match(/^(-?\d*\.?\d+)([a-z%]+)$/i);
if (!match) throw new Error(`Bad measurement: ${base}`);
const [, numStr, unit] = match;
const pad = `${parseFloat(numStr) + 4}${unit}`; // nobody checked that `unit` is what the caller expects

// After: typed math, units enforced by the compiler
const base = m(8);                 // or m(8, "rem"), m(1.5, "em"), etc.
const pad = base.add(4).css();     // type error if units don't match
```

A small TypeScript library for **typed CSS inputs**. csstype types CSS property names and
keywords; CSS-Calipers types the values: measurements (number + unit), ratios, and plain
numbers (integers and floats). Do typed arithmetic, let the compiler catch unit and range
mistakes, and emit a CSS string only at the edge.

CSS-Calipers is **Layer 1** of the CSS-Bookends stack: the typed CSS input primitives,
and nothing else. It is meant to be used **standalone**, by someone who wants only typed
CSS inputs and no helpers at all. Helpers (the "books") are not part of calipers; they
live in the books layer above and consume these primitives. See the root `ARCHITECTURE.md`
and `.claude/CLAUDE.md` for the full three-layer model.

> **Known debt:** the per-property value helpers in `src/css-values/` (`opacity`,
> `zIndex`, `fontWeight`, the `createCssValues` factory) are helpers that currently live
> in calipers, which violates the Layer-1 boundary. They are slated to move to the books
> layer; treat them as transitional, not a permanent calipers feature.

## Install

```bash
npm install @css-bookends/css-calipers
```

## Quick start

```ts
import { m } from "@css-bookends/css-calipers";

const paddingBase = m(4);          // defaults to px (typed as a px measurement)
const rotation = m(45, "deg");     // equivalent to mDeg(45)

// Unit-safe arithmetic
const offset = paddingBase.add(paddingBase.add(4)).multiply(2).subtract(1);

// Emit CSS only at the edge
const style = {
  padding: paddingBase.css(),                        // "4px"
  transform: `rotate(${rotation.double().css()})`,   // "90deg"
};
```

Every standard CSS unit also has a named helper (`mPx`, `mPercent`, `mVw`, `mEm`, `mMs`,
`mFr`, …), equivalent to `m(value, 'unit')`. Helpers are importable from the root, from
`@css-bookends/css-calipers/units`, or per-family subpaths.

## Ratios and plain numbers

Not every CSS value carries a unit. Aspect ratios, opacity, z-index, line-height, and
font-weight are plain numbers, and csstype waves any number through. CSS-Calipers types
those too.

```ts
import { r, i, f, hardenFloat, hardenInteger } from "@css-bookends/css-calipers";

r(16, 9).css();   // "16/9"  aspect-ratio
i(3).css();       // "3"     a whole number
f(0.5).css();     // "0.5"   a real number

// Harden once, reuse: bind a constraint and get a bound factory
const opacity = hardenFloat({ min: 0, max: 1 });
opacity(1.5);                 // throws: 1.5 is above the maximum 1
opacity(0.4).css();           // "0.4"

const fontWeight = hardenInteger({ min: 1, max: 1000 });
fontWeight(700).css();        // "700"

// ratio composes from the primitives and respects their hardening
r(i(16), i(9)).css();         // "16/9"
```

`i()` rejects non-integers, `f()` rejects non-finite values, and both enforce optional
`{ min, max }` bounds that survive arithmetic (a result that breaks the constraint throws).
See **[The number space](docs/number-space.md)** for which CSS values map to which primitive.

## Value hardening

Many CSS values have a restricted domain (padding `>= 0`, opacity `0..1`). Refinements
enforce the restriction at runtime **and** harden the TypeScript type, so a function can
demand a checked value and the compiler rejects anything unchecked.

```ts
import { m, nonNegative, inRange } from "@css-bookends/css-calipers";

nonNegative.ensure(m(-4));               // throws: value must be >= 0
nonNegative.hardenWith(m(apiValue));     // out of range -> falls back to 0, never throws
const opacity = inRange(0, 1).ensure(m(value)); // typed as in-range [0, 1]
```

Built-ins: `nonNegative`, `nonPositive`, `inRange(min, max)` (bounds carried in the type).
Each exposes `is` / `ensure` / `check` / `hardenWith`. Full guide:
**[Value hardening](docs/hardening.md)**.

## Features

- **Compile-time unit validation.** Prevents mixing incompatible units.
- **Arithmetic safety.** Operate only within matching units; conversions are explicit.
- **Typed scalars and ratios.** Integers (`i`), floats (`f`), and ratios (`r`) with optional range bounds that survive arithmetic.
- **Value hardening.** Runtime constraints (non-negative, ranges) that also narrow the type.
- **Explicit emission.** `.css()` outputs a typed string only when needed.
- **Light runtime footprint.** Near-zero cost when emitted at build time.
- **Framework-agnostic.** Works anywhere TypeScript does.

`m` accepts any unit string you'd use in CSS. CSS-Calipers types the numeric inputs to CSS:
unit-bearing measurements, ratios, and plain integers and floats. Keywords (`auto`,
`fit-content`), shorthand strings, `var(--token)`, and `calc(...)` stay as explicit strings
in your styling layer (see [Philosophy](docs/integration.md#philosophy-and-boundaries)).

## Status & support

- Stable `1.0` core (measurements, ratios, and the integer/float scalars), part of the
  [CSS-Bookends](https://github.com/css-bookends/css-bookends) umbrella.
- Tested with TypeScript 5.6+ on Node 18+.
- Solo, early-stage project. If it saves you time, you can
  [buy me a coffee](https://buymeacoffee.com/slafleche).

<a href="https://www.buymeacoffee.com/slafleche" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="48"></a>

## Media queries

Media queries are not part of CSS-Calipers (purely the measurement layer). They live in
[`@css-bookends/media-queries`](https://www.npmjs.com/package/@css-bookends/media-queries).
**Upgrading to v1?** The only change is media queries; if you never used the media-query
helper, v1 is a drop-in.

## Should I use this?

A good fit if you use TypeScript and want compile-time guarantees around CSS units, or you
have a design system where layout math and unit conversions matter. Probably overkill if
your project has little custom layout math, relies mostly on utility classes, or doesn't use
TypeScript.

## Errors

Operations are fail-fast: invalid input (mismatched units, non-finite values, bad clamp
bounds, failed constraints) throws a normal `Error` with the operation name, the values, and
a structured code (for example `CALIPERS_E_UNIT_MISMATCH`). You choose where to place
assertions and whether to catch. Stack hints and per-code details: **[Errors](docs/errors.md)**.

## Factory entrypoint (optional)

For instance-scoped configuration and a single re-export surface:

```ts
import { createCalipers } from "@css-bookends/css-calipers/factory";

const calipers = createCalipers({ errorConfig: { stackHints: "on" } });
export const { m, mPx, units } = calipers;
```

See [examples/factory-wrapper.example.ts](examples/factory-wrapper.example.ts).

## Philosophy

Typed CSS inputs live here; string composition lives elsewhere. `.css()` is an edge, not a
habit. Plain numbers that ARE CSS values (opacity, z-index, ratios) are typed via `i()` /
`f()` / `r()`; a number used only as an arithmetic operand needs no wrapper. Keywords and
`var(--token)` coexist but stay outside the library. Details and integration patterns:
**[Integration & philosophy](docs/integration.md)**.

## Docs

- [Value hardening](docs/hardening.md) — non-negative, non-positive, and typed ranges.
- [Errors](docs/errors.md) — error behavior, common codes, stack hints.
- [Integration & philosophy](docs/integration.md) — worked example, patterns, boundaries.
- [Measurements core](README_MEASUREMENT.md) — the measurement API in depth.
- [The number space](docs/number-space.md) — which CSS values map to integer / float / ratio.
- [Testing](TESTING.md) — testing patterns and dev-only guards.

## Examples

The `examples/` folder contains non-published usage sketches:

- [hardening-fallback](examples/hardening-fallback.example.ts) — harden an API value with
  `ensure` / `is` / `hardenWith`.
- [hardening-range](examples/hardening-range.example.ts) — a typed `inRange` bound flowing
  into a function that demands it.
- [lineHeight-normalizer](examples/lineHeight-normalizer.example.ts) — mixed-input
  normalization (numbers, strings, CSS variables) into a value with `.css()`.
- [validation-unit-tests](examples/validation-unit-tests.example.ts) — enforcing spacing
  token invariants in tests.
- [validation-and-runtime-checks](examples/validation-and-runtime-checks.example.ts) —
  dev-only validation across two consumers using the same measurement.
- [factory-wrapper](examples/factory-wrapper.example.ts) — instance-scoped factory wrapper.
