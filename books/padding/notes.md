# padding book — notes

- **Input domain = the spacing lexicon, narrowed + hardened.** Non-negative measurements and
  the CSS-wide keywords only: `auto` and `anchor-size()` are excluded at the type level
  (`SpacingInput<IMeasurement, CssWideKeyword, never>`), and each measurement is hardened to
  `NonNegativeMeasurement` by running it through the `nonNegative` refinement (the governing
  rule: a runtime restriction must also harden the type).
- Full CSS value surface: [`padding-space.md`](./padding-space.md). Shared lexicon contract:
  the spacing lexicon's `spacing-spec.md`.
- **Complete book:** INPUT (`parsePadding`, hardening) + STORAGE (`storePadding` -> the
  four-side store of tagged slots, carrying `NonNegativeMeasurement`) + OUTPUT
  (`makeSpacingResult`) + the `publishBookPadding` factory. The input gate is inherited through
  the factory: a negative, `auto`, or `anchor-size()` throws on a book call. The hard auto-split
  lives in the store - a `PaddingStore`'s symbolic slot keyword is `CssWideKeyword`, so it can
  never hold `auto` (csstype's `(string & {})` means the output type alone cannot reject it).
- **Deferred:** a compile-checked `examples/` coexistence wrapper; logical (`padding-inline`)
  emission.
