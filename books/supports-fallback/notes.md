# Notes & improvement ideas — @css-bookends/supports-fallback

A running list of known debt and ideas for this package.

## Compiler-agnostic by design  (done)

This used to call vanilla-extract's `globalStyle` directly. It now returns plain
`{ selector, style }` data so any tool can apply it. The library imports no CSS
compiler; `@vanilla-extract/css` is a devDependency only, used by
`examples/vanilla-extract.example.ts`. Keep it that way.

## Optional adapters  (idea)

If integration boilerplate becomes common, consider shipping opt-in adapter
subpaths (e.g. `@css-bookends/supports-fallback/vanilla-extract`) that wrap the
data + the tool, declaring the tool as an optional peer. Core stays agnostic.
