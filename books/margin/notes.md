# margin book — notes

- **Input domain = the spacing lexicon's permissive default** (any-unit measurements,
  `auto`, negatives, `anchor-size()`, CSS-wide keywords). The input step is just
  `parseSpacing` with the default policy, so the design is inherited from the lexicon -
  there is no separate `design.md`.
- Full CSS value surface: [`margin-space.md`](./margin-space.md). Shared lexicon contract:
  the spacing lexicon's `spacing-spec.md`.
- **Staged book:** INPUT only so far. STORAGE (resolve to the four-side store via the
  lexicon's `resolveSpacing`) and OUTPUT (`publishBookMargin`, `.css()`, longhand-default
  emission) are later phases.
