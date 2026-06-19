# padding book — notes

- **Input domain = the spacing lexicon, narrowed + hardened.** Non-negative measurements and
  the CSS-wide keywords only: `auto` and `anchor-size()` are excluded at the type level
  (`SpacingInput<IMeasurement, CssWideKeyword, never>`), and each measurement is hardened to
  `NonNegativeMeasurement` by running it through the `nonNegative` refinement (the governing
  rule: a runtime restriction must also harden the type).
- Full CSS value surface: [`padding-space.md`](./padding-space.md). Shared lexicon contract:
  the spacing lexicon's `spacing-spec.md`.
- **Staged book:** INPUT only so far. STORAGE (resolve to the four-side store via the
  lexicon's `resolveSpacing`) and OUTPUT (`publishBookPadding`, `.css()`) are later phases.
