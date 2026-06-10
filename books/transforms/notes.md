# Notes & improvement ideas — @css-bookends/transforms

A running list of known debt and ideas for this package.

## Individual transform properties  (idea, not started)

The composer emits a single combined `transform` string. Modern CSS (Transforms
Level 2) supports standalone `translate`, `rotate`, and `scale` properties, which
compose better with independent animations/transitions. Consider an opt-in mode
or parallel API that emits the individual properties instead of one `transform`.

## Coverage  (check)

Only 6 tests came over. Audit whether every composer method (`translate`,
`rotate`, `scale`, `skew`, `perspective`, `combine`) and its 3D variants are
exercised before this is treated as v1-ready.
