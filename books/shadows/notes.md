# Notes & improvement ideas — @css-bookends/shadows

A running list of known debt and ideas for this package.

## Review the built-in defaults  (decoupling follow-up)

To drop the portfolio token coupling, `src/shadows.ts` now ships a `shadowDefaults`
object (`offsetX/Y = m(2)`, `blur = m(2)`, `alpha = 1`, `color = color('#000')`).
Those values were inherited from the portfolio's `dropShadowVars`/`colorVars.shadow`
and are placeholders. Decide the real default shadow (a softer `alpha` like ~0.2
is more typical than `1`) and document it. Callers can already override per call.

## Configurable defaults  (idea)

Right now defaults are module-level constants. Consider a small factory
(`createShadows({ defaults })`) so a design system can set its own default shadow
once instead of passing it on every call, mirroring how the portfolio used a token.

## Coverage  (check)

Only 3 tests came over, and the default-path test only checks `startsWith('drop-shadow(')`.
Add assertions for the actual default output and for `textShadow` / `boxShadow`
multi-layer + spread/inset before treating this as v1-ready.

## Refactor to post-processing + the colour updates  (planned)

Shadows is to be refactored to lean on the colour updates (the `[hex, rgba, oklch]`
default output ladder, custom-format registration) and on post-processing (gilding),
rather than assembling colour strings inline. Until then, one test is knowingly red:
`tests/runtime/shadows.src.test.ts` "formats single and multiple box shadows" counts
`rgba(` tokens in a multi-shadow built from the default colour, but the default shadow
is opaque black (`alpha: 1`), which now correctly renders `#000000` (hex), not rgba.
Do NOT band-aid that assertion; it is resolved by the refactor (and by settling the
default shadow alpha, see the defaults note above). The single-shadow rgba assertion
already passes under the new ladder.
