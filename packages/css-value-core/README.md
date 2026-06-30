# @css-bookends/css-value-core

The shared engine behind the per-property CSS-Bookends books: typed helpers for single-value CSS properties (`opacity`, `zIndex`, `fontWeight`, ...), each a constrained scalar built on the calipers `i()` / `f()` primitives plus that property's keyword companions, with `.css()` typed against csstype's `Property`.

> **Beta.** Published under the `beta` tag while the CSS-Bookends API settles. Install with `@beta` and expect changes before a `1.0`.

Most consumers use the per-property **books** (each wraps one property of this engine, e.g. [`@css-bookends/opacity`](https://www.npmjs.com/package/@css-bookends/opacity)) or the [compendium](https://www.npmjs.com/package/@css-bookends/compendium) bundle. This package is the engine they share; use it directly when you want the whole per-property helper set from one factory.

## Install

```sh
npm i @css-bookends/css-value-core@beta
```

## Usage

```ts
import { createCssValues } from '@css-bookends/css-value-core';

const values = createCssValues(); // defaults: outOfRange 'throw', format 'object'

values.opacity(0.5).css();       // { opacity: '0.5' }   (the format:'object' default)
values.opacity(0.5).value.css(); // '0.5'                (the bare value as a CSS string)
values.opacity(0.5).value();     // 0.5                  (the raw number)
values.opacity(0.5).style.css(); // { opacity: '0.5' }   (the property-keyed style object)
values.zIndex(10).css();         // { zIndex: '10' }
```

Each result is navigable: `.css()` returns the configured default form, while `.value.css()` (bare string) and `.style.css()` (property-keyed object) are always reachable.

## Configuration

`createCssValues(config?)` takes a `CssValuesConfig`:

| key          | type                     | default    | meaning                                                     |
| ------------ | ------------------------ | ---------- | ----------------------------------------------------------- |
| `outOfRange` | `'throw'` \| `'clamp'`   | `'throw'`  | a value outside the property's spec range throws, or clamps |
| `format`     | `'object'` \| `'string'` | `'object'` | what the top-level `.css()` returns                         |

```ts
const lenient = createCssValues({ outOfRange: 'clamp' });
lenient.opacity(1.5).css(); // { opacity: '1' }  (clamped into [0, 1])

const strings = createCssValues({ format: 'string' });
strings.opacity(0.5).css(); // '0.5'             (bare string form)
```

A per-call options argument overrides the instance default for one call.

## What it covers

- **Per-property scalar helpers** (`opacity`, `zIndex`, `fontWeight`, `lineHeight`, `order`, ...), each constrained per the CSS spec and typed against the matching csstype `Property`.
- **Multi-value helpers** for properties that take several parts (`scale`, `span`, `strokeDasharray`, the grid-line and counter helpers, ...).
- **`CSS_VALUE_SPEC`** — the per-property spec table (range and keyword rules) that drives the helpers.

## License

MIT © Stéphane LaFlèche
