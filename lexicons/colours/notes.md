# Notes & improvement ideas — @css-bookends/colours

A running list of known debt and ideas for this package. Each item notes its
status. Not a changelog; this is the "what could be better" scratchpad.

## Drop chroma-js, go culori-only  (planned, not started)

The current `src/colorWrap.ts` uses **two** colour libraries: `chroma-js` for
sRGB manipulation (darken/lighten/saturate/mix, `chroma.scale`) and `culori` only
for OKLCH conversion. It works and is tested (13 passing tests), but it is dated.

**Target: culori only.** culori is the modern CSS Color 4 standard (ESM-native,
OKLCH / LCH / Display P3, used by Tailwind v4 and Radix, ~8M weekly downloads), can
do the manipulation too, and outputs native `oklch()` via `formatCss()`. Result:
one runtime dependency instead of two, OKLCH-native, more spec-current.

Rewrite scope:
- Reimplement `ColorWrapper` internals on culori's functional API while keeping
  the public surface stable (`color`, `ColorWrapper`, `isColorWrapper`,
  `mixWithAlpha`, the `create.*` builders, OKLCH helpers) so dependent books are
  not broken.
- Replace `chroma.scale` (used by `createScale`) with culori `interpolate`/`samples`.
- Keep `tests/runtime/colorWrap.src.test.ts` green throughout (it is the contract).
- Remove `chroma-js` + `@types/chroma-js` from `package.json` when done.

Deferred from the initial import wave because colours is a lexicon (the foundation
borders / shadows / outlines / backdrop-filter build on), so the rewrite deserves
its own focused pass.
