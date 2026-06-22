# CSS-Calipers

[![npm](https://img.shields.io/npm/v/@css-bookends/css-calipers.svg)](https://www.npmjs.com/package/@css-bookends/css-calipers)
[![types](https://img.shields.io/npm/types/@css-bookends/css-calipers.svg)](https://www.npmjs.com/package/@css-bookends/css-calipers)
[![license](https://img.shields.io/npm/l/@css-bookends/css-calipers.svg)](./LICENSE.txt)

**CSS is code. Treat it that way.**
Compile-time unit safety for numeric, unit-bearing CSS values, with no surprises at runtime.

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

A small TypeScript library for **type-safe CSS measurements**. Do arithmetic on real numbers
with the unit attached, let the compiler catch `px`-vs-`rem` mistakes, and emit a CSS string
only at the edge.

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
- **Value hardening.** Runtime constraints (non-negative, ranges) that also narrow the type.
- **Explicit emission.** `.css()` outputs a typed string only when needed.
- **Light runtime footprint.** Near-zero cost when emitted at build time.
- **Framework-agnostic.** Works anywhere TypeScript does.

`m` accepts any unit string you'd use in CSS. CSS-Calipers focuses exclusively on numeric,
unit-bearing values; keywords (`auto`, `fit-content`), shorthand strings, `var(--token)`,
and `calc(...)` stay as explicit strings in your styling layer (see
[Philosophy](docs/integration.md#philosophy-and-boundaries)).

## Status & support

- Stable `1.0` release of the measurement layer, part of the
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

Measurement math lives here; string composition lives elsewhere. `.css()` is an edge, not a
habit. Numbers are operands, not values (no unit, no measurement). Keywords and
`var(--token)` coexist but stay outside the library. Details and integration patterns:
**[Integration & philosophy](docs/integration.md)**.

## Docs

- [Value hardening](docs/hardening.md) — non-negative, non-positive, and typed ranges.
- [Errors](docs/errors.md) — error behavior, common codes, stack hints.
- [Integration & philosophy](docs/integration.md) — worked example, patterns, boundaries.
- [Measurements core](README_MEASUREMENT.md) — the measurement API in depth.
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
