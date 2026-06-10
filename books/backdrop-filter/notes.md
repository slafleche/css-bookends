# Notes & improvement ideas — @css-bookends/backdrop-filter

A running list of known debt and ideas for this package.

## `registerBackdropFallback` now returns data  (rename candidate)

It is built on the agnostic `supports-fallback`, so it no longer registers
anything, it returns the `@supports` `{ selector, style }` data for the caller to
apply with their tool. The "register" name is now misleading; consider renaming
to `backdropFallback` and documenting the data-in / data-out flow before v1.

## Coverage  (check)

Only 3 tests came over and they cover the value/style builders, not
`registerBackdropFallback`. Add a test for the fallback hook's returned data.
