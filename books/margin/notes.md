# margin book — notes

- **Input domain = the spacing lexicon's permissive default** (any-unit measurements,
  `auto`, negatives, `anchor-size()`, CSS-wide keywords). The input step is just
  `parseSpacing` with the default policy, so the design is inherited from the lexicon -
  there is no separate `design.md`.
- Full CSS value surface: [`margin-space.md`](./margin-space.md). Shared lexicon contract:
  the spacing lexicon's `spacing-spec.md`.
- **Complete book:** INPUT (`parseMargin`) + STORAGE (`storeMargin` -> the four-side store of
  tagged slots) + OUTPUT (`makeSpacingResult`) + the `publishBookMargin` factory. `auto` and
  `anchor-size()` are first-class, tagged `symbolic` / `anchorSize` in the store and emitted
  verbatim; emission defaults to longhand (only the sides you set), with `emit: 'shorthand'`
  and `format: 'string'` config opt-ins.
- **Deferred:** a compile-checked `examples/` coexistence wrapper (override one axis with a
  hand-written `calc()` via the accessors + spread); logical (`margin-inline`) emission.
