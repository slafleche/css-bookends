# CSS-Calipers

**CSS is code. Measure it like one.**  
Compile-time unit safety for numeric, unit-bearing CSS values, no surprises at runtime.

CSS-Calipers is a tiny layer for typed CSS measurements. Stop parsing CSS strings 
and concatenating units. Do your math on real numbers, get compile-time unit safety, 
and output CSS only at the edges.

At a glance:

- Create measurements with `m` from a number and a unit (defaults to `px`).
- Do unit-safe math with methods like `add` and `multiply`, then call `.css()`
  at the edge to get a CSS string (for example "10px").

## Install

```bash
npm install css-calipers
```

### Status & support

> 🚧 Work in progress.  
> API surface and docs may change between `0.x` releases until the first stable version.

- Status: early `0.x` release. Backwards compatibility is not guaranteed until `1.0.0`.
- Questions or bugs: open an issue on GitHub (see the repository link at the top of this page or in `package.json`).
- Tooling: tested primarily with TypeScript 5.6+ on Node 18+.

---

## Quick start

```ts
import { m } from "css-calipers";

// Declare vars
const paddingBase = m(4); // defaults to "px" with no unit specified
const rotation = m(45, "deg"); // equivalent to a dedicated helper like mDeg(45)

// Do safe arithmetic
const margins = paddingBase.add(4);
const offset = paddingBase.add(margins).multiply(2).subtract(1);

// Emit only at the end in CSS (at runtime or in a build step)
const style = {
  padding: paddingBase.css(),
  transform: `rotate(${rotation.double().css()})`, // 90deg
};
```

---

## Features

- **Compile-time unit validation.** Prevents mixing incompatible units.
- **Arithmetic safety.** Operate only within matching units; explicit when
  converting.
- **Explicit emission.** `.css()` outputs a typed string literal only when
  needed.
- **Light runtime footprint.** Near-zero cost when emitted at build time.
- **Framework-agnostic.** Works anywhere TypeScript does.

Any numeric, unit-bearing CSS value is supported: `m` accepts any unit string you’d use in CSS
(`'px'`, `'rem'`, `'%'`, `'vw'`, `'deg'`, `'ms'`, …), and you can model new
measurements without waiting for a dedicated helper. For convenience and better
types, every standard CSS unit also has a named helper (for example
`mPx`, `mPercent`, `mVw`, `mEm`, `mMs`, `mFr`), which are equivalent to calling
`m(value, 'unit')` directly.

CSS-Calipers focuses exclusively on numeric, unit-bearing CSS values. Keywords
like `auto`, `fit-content`, or `max-content`, full shorthand strings,
`var(--token)`, or `calc(...)` expressions should remain explicit strings or
dedicated keyword types in your app or styling layer. Everything else stays as
plain CSS (see "Philosophy & Boundaries" below for more detail).

---

## Should I use this?

CSS-Calipers is a good fit if:

- You already use TypeScript (or plan to) and want compile-time guarantees around CSS units.
- You have a design system or token layer where layout math and unit conversions matter.
- You care about catching unit mismatches and layout invariants early, in dev or tests.

It’s probably overkill if:

- Your project has minimal custom layout math or relies mostly on utility classes/framework CSS.
- You don’t use TypeScript and aren’t looking for stronger typing around CSS values.
- You’re comfortable relying on manual discipline instead of typed measurements for units.

---

### Layout tokens example

```ts
import { m, mPercent, mVw, mVh, mFr, assertCondition } from "css-calipers";

// Token-style measurements (px by default)
const spacing = m(8); // Defaults to px; equivalent to mPx(8)
const cardPadding = spacing.multiply(2); // 16px
const gutter = spacing.multiply(1.5); // 12px

// Responsive bounds expressed in other units
const minWidthPercent = mPercent(75); // 75%; same as m(75, "%")
const maxWidthViewport = mVw(100); // 100vw; same as m(100, "vw")

// Derived content width in px
const contentBase = m(320);
const minCardWidth = m(260);
const maxCardWidth = m(360);

// In real code, these bounds typically come from tokens or configuration,
// so keeping the clamp in measurement space ensures units stay consistent.
const cardWidth = contentBase.clamp(minCardWidth, maxCardWidth);

// Unitless ratio you can reuse elsewhere
const ratio = contentBase.getValue() / spacing.getValue(); // returns a number, no unit

// Apply ratio to a different unit family
const heroHeight = mVh(40).multiply(ratio);

// Invalid arithmetic (different units) fails at compile time
const exampleError = cardWidth.add(heroHeight); // ❌ Type error (px vs vh) see error handling below

// Use plain numbers where they are just counts
const columns = 3;

// In development, enforce simple invariants so layout mistakes fail fast.
// In production, you can either rely on earlier validation or add a separate
// fallback path if this invariant is ever broken.
if (process.env.NODE_ENV !== "production") {
  assertCondition(
    () => columns > 0,
    "cardGridStyles: columns must be greater than zero"
  );
}

// Compose a simple grid layout
const cardGridStyles = {
  display: "grid",
  gap: gutter.css(),
  gridTemplateColumns: `repeat(${columns}, ${mFr(1).css()})`,
  // width driven by card width + gutters
  width: cardWidth
    .multiply(columns)
    .add(gutter.multiply(columns - 1))
    .css(),
  // container bounds in percent/viewport units
  minWidth: minWidthPercent.css(),
  maxWidth: maxWidthViewport.css(),
  // derived hero height based on px ratio, expressed in vh and used inside a calc() string
  // calc() stays plain CSS; css-calipers only provides the numeric pieces
  minHeight: `calc(${heroHeight.css()} + 10vh)`,
};
```

---

## Do custom checks your way

CSS-Calipers will happily enforce units anywhere you choose, but it stays
unopinionated about where those guards live. Drop assertions in a component, in
a theme overwrite, hardcode a debug routine, or wire a global invariant; the
structure is up to you:

```ts
import { assertMatchingUnits } from "css-calipers";
import { formTokens } from "@/tokens/forms.tokens";

if (process.env.NODE_ENV !== "production") {
  assertMatchingUnits(
    formTokens.field.paddingBlock,
    formTokens.field.paddingInline,
    "Form control padding mismatch"
  );
}
```

You can apply the same checks globally (e.g., during app bootstrap) or only
inside the components that need them. CSS-Calipers gives you the tools;
placement is a design decision.

---

## Error behavior

- Operations are fail-fast: when you call helpers like `add`, `divide`, `clamp`,
  `measurementMin` / `measurementMax`, or the assertion helpers with invalid
  input (for example, mismatched units or non-finite values), css-calipers
  throws a normal `Error`.
- Error messages include the operation name (for example,
  `css-calipers.Measurement.divide` or `css-calipers.assertMatchingUnits`), the
  relevant values/units, and any context string you pass in.
- The library does not catch these errors for you. You choose where to place
  assertions and where (if anywhere) to catch and handle exceptions.
- In production, a common pattern is to wrap assertions in dev-only guards
  (such as `if (process.env.NODE_ENV !== 'production')`) or to enforce
  invariants in tests, so checks stay cheap and predictable at runtime.

---

## Co-existing with other systems

You don’t have to convert everything at once, or at all. If it fits your setup, you can write small adapters that accept existing CSS strings, css-calipers measurements, or plain numbers and turn them into CSS values. The example below is just one possible adapter pattern, not a recommendation or default.

```ts
import { m, isMeasurement } from "css-calipers";

type SpacingInput = string | number | ReturnType<typeof m>;

const toSpacingCss = (value: SpacingInput): string => {
  if (typeof value === "string") {
    // Already a CSS value (for example, "auto" or "var(--gap)")
    return value;
  }

  const measurement = isMeasurement(value) ? value : m(value);
  return measurement.css();
};

// Later, callers can pass tokens, raw CSS strings, or measurements:
toSpacingCss("var(--card-gap)");
toSpacingCss(8); // becomes "8px"
toSpacingCss(m(12, "px"));
```

---

## Advanced

### String Literal Type Exclusion

When helpers must _exclude_ CSS-Calipers–emitted numeric, unit-bearing CSS values from a keyword union,
use the exported `MeasurementString` type together with your existing CSS
property typings (for example, the `Property` types from the `csstype`
package):

```ts
import type { MeasurementString } from "css-calipers";
import type { Property } from "csstype";

type SpacingKeyword = Exclude<
  Extract<Property.Margin, string>,
  MeasurementString
>;
```

This lets helpers stay strict: `IMeasurement` for numeric, unit-bearing CSS values; targeted string
keywords for symbolic CSS values, without reintroducing vague unions like
`MeasurementLike`.

### Integration Patterns

- **Typed helpers:** Accept either `IMeasurement` or a constrained keyword type,
  never a generic string.
- **Pre-emission transforms:** Compose all math in CSS-Calipers, emit once at
  the style boundary.
- **Build-time pipelines:** Run measurement math in Node or a build step
  (scripts, codegen, or bundler plugins) and emit plain CSS or tokens for your
  existing styling system so runtime only sees static values.
- **Unit guards in debug:** Use `assertUnit()` in dev-only blocks to confirm
  consistency between related measurements.
- **CSS variables:** Pass CSS-Calipers css output into style layers that
  interpolate them, but don’t try to store `var(--token)` inside the library.

---

## Philosophy & Boundaries

- **Measurement math lives here; string composition lives elsewhere.**  
  Use CSS-Calipers for unit-aware calculations, then hand results to
  helpers/adapters that emit CSS literals. Keep `calc()`/`clamp()` logic outside
  the library so measurement objects remain pure.

- **`.css()` at runtime is an edge, not a habit.**  
  You can call `.css()` at runtime, but prefer emitting once to avoid hot-path
  string churn.

- **Numbers are operands, not CSS-Calipers values.**  
  You cannot create a CSS-Calipers value without a unit. Pass plain numbers as
  operands (`add`, `subtract`, `multiply`, `divide`) or combine with another
  `IMeasurement`, but never store bare numbers inside library state. If a value
  lacks both number and unit, CSS-Calipers won’t track it; you own whatever
  logic wraps it.

- **Model keywords explicitly (not “escape hatches”).**  
  If a helper needs symbolic CSS (e.g., `'auto'`, `'fit-content'`), define a
  precise keyword type and purposely exclude the emitted string type from
  CSS-Calipers so numeric, unit-bearing CSS values remain the default path.

- **CSS custom properties coexist; they don’t mix.**  
  Third-party primitives exposing `var(--token)` should keep those values as raw
  CSS strings. Feed CSS-Calipers css output into them where possible, but don’t
  wrap CSS variables inside the library; treat them as parallel pipes that meet
  in the style layer.
