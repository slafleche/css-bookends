# @css-bookends/opacity

Typed `opacity` for CSS: a constrained `0..1` alpha that renders through one `.css()` terminal, typed against csstype's `Property.Opacity`.

> **Beta.** Published under the `beta` tag while the CSS-Bookends API settles. Install with `@beta` and expect changes before a `1.0`.

Part of [CSS-Bookends](https://github.com/css-bookends/css-bookends): typed CSS inputs in, a typed `.css()` string out, with a loose, ergonomic middle. Every helper is a "book" you bind once through its factory.

## Install

```bash
npm i @css-bookends/opacity@beta
```

Peer dependencies: `@css-bookends/self-publish`, `@css-bookends/css-calipers`, `@css-bookends/css-value-core`.

## Usage

```ts
import { publishBookOpacity } from '@css-bookends/opacity';

// Bind the book once (the factory is the configurable seam), then call it.
const opacity = publishBookOpacity();

opacity(0.5).css();   // { opacity: '0.5' }  (a property-keyed style object, typed against Property.Opacity)
opacity().css();      // { opacity: '1' }    (the configured default alpha)
opacity(0.5).value(); // 0.5                 (the raw number back)
```

Out-of-range alphas throw by default. Bind a clamping book instead:

```ts
const opacity = publishBookOpacity({ config: { outOfRange: 'clamp' } });

opacity(1.5).css(); // { opacity: '1' }  (clamped into [0, 1])
```

## API

### `publishBookOpacity(options?)`

Returns an opacity book. `options.config` is a partial `OpacityConfig`:

| key          | type                  | default   | meaning                                              |
| ------------ | --------------------- | --------- | ---------------------------------------------------- |
| `value`      | `number`              | `1`       | the alpha a bare call (or `'unset'`) renders         |
| `outOfRange` | `'throw'` \| `'clamp'`| `'throw'` | how a number outside `[0, 1]` is handled             |

### The book: `opacity(input?)`

`input` is `number | 'unset'` (omit it, or pass `'unset'`, for the configured default). Returns a `ResolvedOpacity`:

- `.css()` returns a property-keyed style object `{ opacity: <Property.Opacity> }` (e.g. `{ opacity: '0.5' }`).
- `.value()` returns the raw alpha `number`.

## Why a factory?

You bind the book once in your own module and import it from there, so configuration, the override seam, and any later library-internal changes live in one file, not across every call site. See the [factory rationale](https://github.com/css-bookends/css-bookends#factories-the-override-seam) in the monorepo.

## License

MIT © Stéphane LaFlèche
