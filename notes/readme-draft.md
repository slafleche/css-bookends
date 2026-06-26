# @css-bookends/css-calipers

The missing pieces of typed CSS input, build-time-validated: colour, measurements, integers, floats, and ratios.

## The problem

CSS input values are untyped. A measurement is a string (`'8px'`), an opacity is a bare number, a colour is whatever string you typed. Nothing catches `opacity: 1.5`, a `px` value added to an `em`, or a `z-index` that is silently a float. The mistake surfaces in the browser, not the compiler.

## Highlights

`.css()` on a colour emits the simplest format that holds it without losing information:

```ts
import { color } from '@css-bookends/css-calipers';

color('#3366cc').css();             // '#3366cc'                  (opaque -> hex)
color('#3366cc').alpha(0.5).css();  // 'rgba(51, 102, 204, 0.5)'  (translucent -> rgba)
color('oklch(0.7 0.37 150)').css(); // 'oklch(0.7 0.37 150 / 1)'  (wide gamut -> oklch)
```

That ladder is the default and is reconfigurable: set your own output format or priority list, per call or per instance.

Measurements are branded by unit, so a `px` cannot be added to an `em`, and arithmetic re-validates:

```ts
import { m } from '@css-bookends/css-calipers';

m(8).add(m(4)).css();          // '12px'  (m() defaults to px)
m(2, 'rem').multiply(2).css(); // '4rem'
```

Ratios accept typed integers and floats on either side:

```ts
import { r, i, f } from '@css-bookends/css-calipers';

r(i(16), i(9)).css();  // '16/9'
r(f(1.5), i(2)).css(); // '1.5/2'  (a float and an integer)
```

Refinements turn a runtime check into a compile-time guarantee: the checked value is branded, so a function that demands a non-negative measurement cannot be handed an unchecked one.

```ts
import { m, nonNegative, inRange } from '@css-bookends/css-calipers';

// `ensure` runs the check, then hands the value back with a HARDENED type. The brand
// proves it passed, so anything typed NonNegativeMeasurement is known to be checked.
const width = nonNegative.ensure(m(8)); // type: NonNegativeMeasurement<'px'>  (throws if negative)

// `inRange` bakes its literal bounds into the type, so it is distinct from any other range.
const pct = inRange(0, 100).ensure(m(50, '%')); // type: InRangeMeasurement<'%', 0, 100>

// `hardenWith` always returns a valid, hardened value: if the input fails the check it
// falls back to a known-good one instead of throwing.
nonNegative.hardenWith(m(-4, 'px')).css(); // '0px'  (-4 fails the check, so it falls back to 0)
```

Integers (`i`), floats (`f`), and custom colour formats round out the set.

## Why csstype does not cover this

`csstype` is excellent and ships here as a dependency. It types CSS property names and their keywords well. What it leaves loose is open INPUT values: where a property accepts an open number or string, csstype falls back to `(number & {})`, so a bare `1.5`, a `px` added to an `em`, or a float `z-index` all pass. You cannot construct a validated value from that. calipers fills exactly that gap, and `.css()` renders to a string that still satisfies csstype on output. It complements csstype; it never replaces it. csstype types the property and keyword side, calipers types the value side, and the aim is a complete typed surface for CSS input, built from both.

calipers is standalone and complete on its own. It is also Layer 1 of the larger CSS-Bookends project (helpers, then an opinionated framework, built on these primitives), and design-token (DTCG) documents convert to these primitives via the Bookends typesetter. Both are there if you want them, never required.

## Install

```sh
npm install @css-bookends/css-calipers
```

Dependencies: `csstype` and `culori` (the colour engine). ESM and CommonJS are both published; the colour surface is reachable from the root import.

## Colour

`color(input, config?)` parses a CSS string, a structured `ColorObject` (one shape per colour space: `{ space: 'rgb', r, g, b, alpha? }`, hsl, hwb, lab, lch, oklab, oklch), a symbolic keyword (`currentColor`, a system colour, a cascade keyword), or an existing resolved colour. It normalizes to OKLCH internally and returns an immutable result.

Modifications return a new colour (the original is untouched) and thread the configured output format through: `darken`, `lighten`, `brighten`, `saturate`, `desaturate`, `setLightness`, `setChroma`, `setHue`, `hueShift`, `complement`, `mix`, `mixSolid`, `mixWithAlpha`, `alpha`, `solid`, `clone`, `contrast`. See `examples/color-modify.example.ts`.

**Output.** `.css()` takes no argument and walks the default ladder `[hex, rgba, oklch]` (the order is backed by usage data, see `docs/color-format-popularity.md`). Force a format with a named selector (`.hex()`, `.rgb()`, `.rgba()`, `.hexAlpha()`, `.hsl()`, `.hwb()`, `.lab()`, `.lch()`, `.oklab()`, `.oklch()`, `.displayP3()`) or `.formatAs(...)`. `omitOpaqueAlpha` drops the alpha slot for an opaque colour where it is optional (lossless, off by default).

**Strictness.** When a render cannot faithfully hold the colour (dropping a real alpha, out of sRGB gamut, modifying a symbolic colour), `strictness` decides: `auto` (default, throw in dev, warn in prod), `throw`, `warn`, or `silent`.

```ts
color('#3366cc80').rgb().css();                           // throws in dev (rgb carries no alpha)
color('#3366cc80', { strictness: 'silent' }).rgb().css(); // 'rgb(51, 102, 204)'  (alpha dropped)
```

**Transparency.** A fully transparent colour renders as the `transparent` keyword by default; configurable with `{ transparent: 'keyword' | 'white' | 'black' | 'preserve' }` or per render with `.transparentAs(mode)`. See `examples/transparency.example.ts`.

**Custom formats.** `createColor({ formats })` binds custom format plugins. A plugin bridges the input and output edges (storage stays canonical OKLCH) and gets a typed named selector; author one with `defineColorSpace`, and an optional `fallback` hook rewrites its output into browser-safe CSS. See `examples/custom-format.example.ts` (its "zoo" format is a deliberately silly extensibility demo, not a real format), `examples/plugin-fallback.example.ts`, and `docs/adding-a-color-format.md`.

## Measurements

`m(value, unit?)` builds a measurement (unit defaults to `px`, lower-cased). Arithmetic, `round`, and `clamp` return new measurements in the same unit. Per-unit helpers bind the unit (`mPx`, `mEm`, `mRem`, `mPercent`, `mCqw`, ...) across every unit family: absolute, font-relative, viewport, container, angle, time, frequency, resolution, and grid.

## Integers and floats

`i()` (a whole number) and `f()` (a real number) are constrained scalars for the unitless number space CSS leaves untyped. Both validate at construction and re-validate on every operation, so a constrained value stays valid (or throws) through arithmetic. `clamp(min, max)` snaps into range instead of throwing; `hardenInteger({ min, max })` / `hardenFloat({ min, max })` bind a constraint once into a reusable factory. See `examples/integers-floats.example.ts`.

## Ratios

`r(numerator, denominator?)` (denominator `1` when omitted) accepts typed integers and floats on either side, with helpers `simplifyRatio`, `reduceRatio`, `normalizeRatio`, and `parseRatio`. See `examples/ratio.example.ts`.

## Hardening and constraints

Refinements run a runtime check and return the same value branded with the constraint, so a function can demand "a non-negative measurement" and the compiler rejects anything unchecked (brands are keyed by a private symbol). The built-ins are `nonNegative`, `nonPositive`, and `inRange(min, max)`, each exposing `.is` / `.ensure` / `.check` / `.hardenWith`. `inRange` carries its literal bounds in the type. Build your own with `makeMeasurementRefinement`. The full model is in `docs/hardening.md`, with runnable examples in `examples/refinements.example.ts`.

## Per-property value helpers (known debt)

calipers currently also ships per-property value helpers (`opacity`, `zIndex`, `fontWeight`, ...) under `src/css-values/`. These are HELPERS, which belong in the books layer, not the input-primitives layer. They are known debt, slated to move OUT of calipers into css-bookends. Treat them as transitional; they are not a permanent calipers feature and are not documented as one here.

## Factories

The bare exports (`m`, `color`, the refinements, ...) are each a default instance of a factory at its defaults, so the default and a custom instance share one construction path. `createCalipers({ errorConfig? })` returns a measurement instance, and `createColor({ formats })` a colour instance with custom format plugins registered. See `examples/factory-wrapper.example.ts`.

## Documentation

Deeper dives live in `docs/`:

- `docs/number-space.md` - which scalar CSS values are worth typing, and why.
- `docs/hardening.md` - the refinement model, branded types, and custom refinements.
- `docs/custom-format-registration.md` and `docs/adding-a-color-format.md` - registering custom colour formats end to end.
- `docs/color-format-popularity.md` - the usage data behind the default output ladder.
- `docs/integration.md` - using calipers with a styling pipeline.
