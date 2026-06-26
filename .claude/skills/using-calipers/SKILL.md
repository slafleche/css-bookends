---
name: using-calipers
description: Rules for css-calipers in this repo - every numeric, unit-bearing CSS value is an m() measurement (never a hand-written string), math stays in measurement space, and .css() emits once at the edge. Use when writing or reviewing any CSS value, unit, or measurement, or any helper input that takes a length/angle/time/etc.
---

# using-calipers

Calipers is **Layer 1** of the stack: typed input primitives only, no helpers (the
canonical three-layer model is in `.claude/CLAUDE.md` / `AGENTS.md`). In CSS-Bookends,
**every numeric, unit-bearing CSS value is a css-calipers measurement** (`m()` from
`@css-bookends/css-calipers`), never a hand-written string like `'8px'`. Do the math in
measurement space and emit a string once, with `.css()`, at the very edge. This is what
keeps units type-safe and output valid.

## The rule: measurement vs not

**MUST be a measurement (`m()`):** any number + CSS unit.

| Use a measurement | Not |
| --- | --- |
| `width: m(320).css()` | `width: '320px'` |
| `padding: m(1.5, 'rem').css()` | `'1.5rem'` |
| `gap: m(12).css()` | `'12px'` |
| rotation `m(45, 'deg')` | `'45deg'` |
| duration `m(200, 'ms')` | `'200ms'` |
| `fontSize: m(2.5, 'vw').css()` | `'2.5vw'` |

**MUST stay a plain string / number (do NOT wrap in `m()`):**

- **Keywords:** `auto`, `fit-content`, `max-content`, `min-content`, `normal`,
  `center`, `stretch`, `baseline`, ... (model these as typed string unions).
- **CSS custom properties:** `var(--token)`, `var(--space, 1rem)` - keep as strings;
  calipers never parses or stores them.
- **CSS math functions** `calc()` / `min()` / `max()` / `clamp()` (and friends):
  **intentionally out of scope.** Compose the string outside calipers; calipers only
  provides the numeric pieces (`` `calc(${m(8).css()} + 10vh)` ``). You MAY use CSS
  variables inside them (`` `calc(var(--gap) + ${m(4).css()})` ``) - the whole thing stays
  plain CSS, not a calipers value. When building a helper/book, do NOT accept or emit these
  as input; they are not part of the helper. They coexist happily next to helper output as
  plain CSS (you write them by hand).
- **Shorthands / complex strings:** `linear-gradient(...)`, `url(...)`,
  `margin: 10px 20px` (build from individual measurements, do not wrap the whole).
- **Unitless numbers:** `line-height: 1.5`, `z-index: 10`, `opacity: 0.8`,
  `font-weight: 600`, `flex-grow: 1`, column counts - plain numbers.
- **Aspect ratios / fractions:** use `r(16, 9)` (the ratio helper), not `m()`.

If a value is both numeric and carries a unit, it is a measurement. Everything else
stays explicit.

## Composing with plain CSS (calc / var coexistence)

Because `calc()` / `min()` / `max()` / `var()` are out of scope, when a value needs one, let
the helper produce the measurement-driven sides and hand-write the rest as plain CSS. The
cascade and partial application keep this clean (these are possibilities, not prescribed
best practice):

- **Override after the shorthand.** Emit the full shorthand from the helper, then override
  one side with a plain-CSS longhand on the next line - the later declaration wins:

  ```css
  margin: 8px 16px;                   /* helper output */
  margin-left: calc(var(--x) + 4px);  /* hand-written, wins */
  ```

- **Partial helper + plain longhand.** Apply the helper to a subset of sides and hand-write
  the remaining side as a longhand:

  ```css
  /* helper emits top + the inline (left/right) sides */
  margin-bottom: calc(var(--footer) - 8px);  /* hand-written */
  ```

The measurement-driven sides stay type-safe; the calc / var side stays plain CSS.

**Prefer longhand output.** A side-emitting book (padding, margin, inset, …) should default
to emitting **longhands**, not the shorthand. Longhands only touch the sides you specify,
whereas the shorthand resets the omitted sides - so longhands give finer override control
and clean partial application (leave a side out, hand-write it with `calc()`/`var()`).
Longhand's usual downside, verbosity, does not apply here: the helper generates the output,
so the author writes nothing extra (the verbosity is generated CSS only). Shorthand is at
most an opt-in for compact generated output.

## Create

```ts
import { m, mRem, mPercent, mDeg } from '@css-bookends/css-calipers';

m(4); // 4px - unit defaults to px
m(1.5, 'rem'); // 1.5rem (any CSS unit string works)
mRem(1.5); // same, via a named helper
m(12, { context: 'tokens.gap' }); // context label shows up in errors
```

Named helpers exist for every standard unit (`mPx mEm mRem mPercent mVw mVh mCh mFr
mDeg mRad mTurn mS mMs mDpi` and the small/large/dynamic viewport + container
families). They are equivalent to `m(value, 'unit')`; use whichever reads better.
Grouped imports live under `@css-bookends/css-calipers/units` and `/units/*`.

## Operate (stay in measurement space, emit once)

Do all arithmetic on measurements, then `.css()` at the edge.

```ts
const base = m(8);
base.add(4); // 12px   (add/subtract take a number OR a same-unit measurement)
base.add(m(4)); // 12px
base.multiply(1.5); // 12px  (multiply/divide take a plain number only)
base.double(); // 16px   (.half(), .negation(), .absolute() too)
base.round(); // .round(precision?) / .floor() / .ceil()
m(15).clamp(m(10), m(12)); // 12px  (bounds must be the same unit)
measurementMin(a, b); // smaller of two same-unit measurements (measurementMax too)
base.getValue(); // 8 (a plain number, no unit)
```

- **Unit-safe.** Mixing units is a **compile-time** error and a runtime throw:
  `m(8).add(m(1, 'em'))` is rejected. There is no implicit conversion.
- **Cross-unit / cross-family math** goes through plain numbers: take `.getValue()`,
  compute a ratio, multiply the other measurement by that number
  (`mVh(40).multiply(contentPx.getValue() / m(8).getValue())`).

## Validate (dev-only)

Calipers is fail-fast (throws a normal `Error`). Put extra invariants behind a
dev guard so they cost nothing in production:

```ts
import { assertCondition, assertMatchingUnits } from '@css-bookends/css-calipers';

if (process.env.NODE_ENV !== 'production') {
  assertMatchingUnits(paddingBlock, paddingInline, 'form padding');
  assertCondition(() => columns > 0, 'columns must be > 0');
}
```

## Helper inputs

Books in this repo accept measurements, not raw numbers/strings, for any
unit-bearing input (e.g. a border width is an `IMeasurement`, `colour.hueShift`
takes a `DegMeasurement`). Pass `m(...)`, never a string.

## Types

- `IMeasurement` (and per-unit types like `DegMeasurement`, `PxMeasurement`) for
  typed inputs.
- `MeasurementString` to *exclude* calipers-emitted values from a keyword union:
  `Exclude<Extract<Property.Margin, string>, MeasurementString>`.

## Emit

`.css()` is the edge. Call it once when building the final style object / string,
not in hot paths; keep measurements as objects through all composition.
