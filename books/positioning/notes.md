# Notes & improvement ideas — @css-bookends/positioning

A running list of known debt and ideas for this package.

## Logical inset properties  (idea, not started)

The absolute presets emit physical `top`/`right`/`bottom`/`left`. Modern CSS has
`inset`, `inset-inline`, and `inset-block` (direction-aware). Consider an opt-in
logical mode so anchoring works in RTL / vertical writing modes.

## Coverage  (check)

Only 4 tests came over. Audit the `absolutePosition` corner presets, the
`flexPosition` helpers, `flexMiddle`, `fullSizeOfParent`, and `inheritHeight`
before treating this as v1-ready.
