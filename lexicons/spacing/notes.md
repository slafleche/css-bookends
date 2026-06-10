# Notes & improvement ideas — @css-bookends/spacing

A running list of known debt and ideas for this package. Each item notes its
status. Flagged as a likely early v1 candidate (along with the calipers lexicon).

## Logical properties  (idea, not started)

The builder emits physical sides (`top`/`right`/`bottom`/`left`). Modern CSS has
logical properties (`padding-inline`/`padding-block`, `margin-inline`/`margin-block`)
that respect writing-mode / direction for i18n. Consider an opt-in logical mode or
a parallel API so spacing works correctly in RTL / vertical writing modes.

## Reconcile the inlined base types  (housekeeping)

`src/types.ts` inlines `Axis`, `AxisValues`, `SpacingKeyword`, `SpacingValue` so
this package stays standalone. `Axis` and `AxisValues<T>` are general (not
spacing-specific) and also live in other helpers. If a shared `@css-bookends/types`
lexicon is created later, dedupe these against it, keeping spacing publishable on
its own.

## Verify gap coverage  (check)

Confirm `gaps()` distinguishes `row-gap` / `column-gap` (not just the `gap`
shorthand) and document the shorthand-vs-axis behavior in tests.
