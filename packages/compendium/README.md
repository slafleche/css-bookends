# @css-bookends/compendium

The whole of CSS-Bookends behind one factory: every helper book plus the calipers value primitives, bound and ready in a single object.

> **Beta.** Published under the `beta` tag while the CSS-Bookends API settles. Install with `@beta` and expect changes before a `1.0`.

## What it is

CSS-Bookends is the helper layer (Layer 2) on top of [`@css-bookends/css-calipers`](https://www.npmjs.com/package/@css-bookends/css-calipers). Each helper is a "book" (a per-property or composed helper) published as its own package. The **compendium** is the everything-bundle: instead of installing and wiring dozens of books, you install one package and call one factory.

```sh
npm install @css-bookends/compendium
```

## `publishCompendium()`

`publishCompendium` is the path, and the default export. A bare call binds every active book at its defaults and spreads the calipers lexicons (`m` / `r` / `i` / `f` / `color`) straight up by name, so everything is on one object.

```ts
import publishCompendium from '@css-bookends/compendium';

const c = publishCompendium();

c.m(8).css();          // '8px'                (calipers measurement)
c.opacity(0.5).css();  // { opacity: '0.5' }   (per-property book; the format:'object' default)
c.color('#3366cc').css(); // '#3366cc'         (the colour book)
c.borders;             // the borders book, callable
c.shadows;             // a composed-book namespace
```

Per-property books render to the `format: 'object'` shape by default (a property-keyed style object); the raw value is available via `.value()`. The colour book is assigned last so it wins the `color` slot over the calipers colour value function.

## Configuration is a cascade

`publishCompendium(config)` takes `CompendiumConfig`: a `global` slot of shared options, one optional key per configurable book, and a nested `calipers` key carrying the whole corpus (calipers) config. Bundles NEST, and the most specific setting wins.

- A **book** resolves a setting: its own key → `compendium.global` → the book's built-in default.
- A **primitive** (through the nested corpus) resolves: `calipers.<unit>` → `calipers.global` → `compendium.global` → the factory default.

```ts
import publishCompendium from '@css-bookends/compendium';
import { colorFormats } from '@css-bookends/css-calipers';

// configure one book
publishCompendium({ color: { output: colorFormats.rgba } })
  .color('#3366cc')
  .css(); // 'rgba(51, 102, 204, 1)'

// a global reaches the calipers primitives through the nested corpus
const lenient = publishCompendium({ global: { hardening: 'ignore' } });
lenient.i(8, { min: 0, max: 10 }).multiply(2).value(); // 16  (broken bound dropped)

// most specific wins: the corpus global overrides the compendium global for primitives
publishCompendium({
  global: { hardening: 'fail' },
  calipers: { global: { hardening: 'ignore' } }, // primitives end up 'ignore'
});
```

The composed books (`backdropFilter`, `positioning`, `shadows`, `supportsFallback`, `transforms`) are utility namespaces with no per-book config, so they have no key in `CompendiumConfig`; they are still bound on the returned object.

## Zero-config defaults: the `/defaults` subpath

If you only want the bound helpers and never touch the factory, import the bound-at-defaults set directly:

```ts
import { m, opacity, color, borders } from '@css-bookends/compendium/defaults';
```

`@css-bookends/compendium/defaults` is `publishCompendium()` called once and re-exported member by member. It and the calipers `corpus` entry are the project's two lazy-defaults entries; configuration always goes through the factory.

## Layers

- **Layer 1 — [css-calipers](https://www.npmjs.com/package/@css-bookends/css-calipers):** typed, build-time-validated CSS input values (colour, measurements, integers, floats, ratios).
- **Layer 2 — bookends:** the helper books that turn those typed inputs into useful output; the compendium is their full bundle. Typed input and typed output, with a loose, ergonomic middle.

`gilding` is the output-edge finisher (browser-compat post-processing); the typesetter ingests design tokens. Both are optional.
