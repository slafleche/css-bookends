# CSS-Calipers

**CSS is code. Measure it like one.**  
Compile-time unit safety for CSS values — no surprises at runtime.

CSS-Calipers provides a type-safe measurement layer for CSS logic.  
Define, validate, and compose unit-aware values (`px`, `%`, `deg`, `ms`, …) at
build time to eliminate silent math errors and improve maintainability in
design-system code.

## Install

```bash
npm install css-calipers
```

> 🚧 Work in progress.  
> API surface and docs may change before the first stable release.

---

## Quick start

```ts
import { m } from "css-calipers";

// Declare vars
const paddingBase = m(4); // defaults to "px" with no unit specified
const rotation = m(45, "deg"); // equivalent to a dedicated helper like mDeg(45)

// Do safe arithmetic
const margins = paddingBase.add(4);
const offset = paddingBase.add(margins).multiply(2).substract(1);

// Emit only at the end in CSS
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

Any scalar CSS value is supported: `m` accepts any unit string you’d use in CSS
(`'px'`, `'rem'`, `'%'`, `'vw'`, `'deg'`, `'ms'`, …), and you can model new
measurements without waiting for a dedicated helper. For convenience and better
types, every standard scalar unit also has a named helper (for example
`mPx`, `mPercent`, `mVw`, `mEm`, `mMs`, `mFr`), which are equivalent to calling
`m(value, 'unit')` directly.

Non-scalar CSS values don’t live inside css-calipers. Keywords like `auto`,
`fit-content`, or `max-content`, full shorthand strings, `var(--token)`, or
`calc(...)` expressions should remain explicit strings or dedicated keyword
types in your app or styling layer. Css-calipers focuses on the numeric,
unit-bearing parts of your styles; everything else stays as plain CSS.

Css-calipers focuses on the numeric, unit-bearing parts of your styles; everything else stays as plain CSS (see ‘Philosophy & Boundaries’ below for more detail).”

---

### Messy example

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
  // calc() stays plain CSS; css-calipers only provides the scalar pieces
  minHeight: `calc(${heroHeight.css()} + 10vh)`,
};
```

---

## Do custom checks your way

CSS-Calipers will happily enforce units anywhere you choose, but it stays
unopinionated about where those guards live. Drop assertions in a component, in a theme overwrite, hardcode a debug routine, or wire a global invariant—the structure is up to
you:

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

When helpers must _exclude_ CSS-Calipers–emitted scalars from a keyword union,
use the exported `MeasurementString` type:

```ts
import type { MeasurementString } from "css-calipers";

type SpacingKeyword = Exclude<
  Extract<CSS_TYPES.Property.Margin, string>,
  MeasurementString
>;
```

This lets helpers stay strict — `IMeasurement` for scalars; targeted string
keywords for symbolic CSS values — without reintroducing vague unions like
`MeasurementLike`.

### Integration Patterns

- **Typed helpers:** Accept either `IMeasurement` or a constrained keyword type,
  never a generic string.
- **Pre-emission transforms:** Compose all math in CSS-Calipers, emit once at
  the style boundary.
- **Unit guards in debug:** Use `assertUnit()` in dev-only blocks to confirm
  consistency between related measurements.
- **CSS variables:** Pass CSS-Calipers scalars into style layers that
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
  lacks both number and unit, CSS-Calipers won’t track it—you own whatever logic
  wraps it.

- **Model keywords explicitly (not “escape hatches”).**  
  If a helper needs symbolic CSS (e.g., `'auto'`, `'fit-content'`), define a
  precise keyword type and purposely exclude the emitted string type from
  CSS-Calipers so scalars remain the default path.

- **CSS custom properties coexist; they don’t mix.**  
  Third-party primitives exposing `var(--token)` should keep those values as raw
  CSS strings. Feed CSS-Calipers scalars into them where possible, but don’t
  wrap CSS variables inside the library — treat them as parallel pipes that meet
  in the style layer.
