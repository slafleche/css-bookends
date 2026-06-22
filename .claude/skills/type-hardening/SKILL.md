---
name: type-hardening
description: The CSS-Bookends hardening discipline - a runtime restriction on a value MUST also harden the TS type (branded), at both the input and output edges. Use when adding a value constraint (non-negative, a gamut, a format), a branded type, or any input/output type for a book or lexicon.
---

# type-hardening

When you restrict a value at runtime, the type must carry the restriction too, so the
compiler enforces it downstream. A runtime check that does not narrow the type is a
half-measure: the next function has no way to demand the checked value.

## The rules

- **Runtime restriction => branded type.** If input is rejected unless it meets a
  constraint, the accepted value's TYPE is branded with that constraint, and any
  function that requires it demands the brand. The compiler then rejects unchecked
  values.
  ```ts
  nonNegative.ensure(m(-4));        // throws AND returns NonNegativeMeasurement
  type PaddingStore = SpacingStore<NonNegativeMeasurement>;  // the brand survives storage
  ```
- **Harden both edges.** INPUT: hardened contracts like padding's
  `NonNegativeMeasurement`. OUTPUT: brand the rendered value to its variant/type, e.g.
  `ColorString<F>` returned by a format selector.
- **Brand is phantom; cast once at the trusted boundary.** A brand is a compile-time
  tag on a real value (a measurement, a string). Mint it at the boundary with a cast
  (`as ColorString<'hex'>` inside a descriptor's `render`), then it flows typed.
- **Generic over the constrained type for reuse.** Shared machinery is generic over the
  value type so each book narrows it (spacing: padding instantiates with
  `NonNegativeMeasurement`, margin with `IMeasurement`).
- **Prove it.** Add a type-level test (`expectTypeOf`, or a tsd file) that the brand
  holds and an unchecked value is rejected.

## Reference

calipers refinements (`nonNegative` / `inRange` / `NonNegativeMeasurement`) and
`docs/hardening.md`; `ColorString<F>` + `ResolvedColor<F>` in `lexicons/color/`; the
`formats.hardening` type test.
