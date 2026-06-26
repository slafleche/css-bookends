# @css-bookends/gilding

The CSS-Bookends **finisher**: a build-time pass that wraps a CSS post-processor
(default: [Lightning CSS](https://lightningcss.dev/)) to complete browser
compatibility - older-browser color fallbacks and vendor prefixes - over the plain CSS
that books emit.

It is the output-edge construct, opposite the typesetter (typesetter: DTCG tokens in;
gilding: finished CSS out). Books and lexicons stay browser-agnostic and emit clean
modern CSS; gilding adds the compatibility trim, driven by your browser targets.

## What it is, and what it isn't

Gilding does not reimplement browser-compatibility handling. [Lightning
CSS](https://lightningcss.dev/) does the actual work: the fallbacks, the vendor
prefixing, the gamut gating. Gilding is the thin bookends layer around it, a stable
evergreen surface (your browser `targets`) and a swappable core, consistent with the
rest of CSS-Bookends, so the output edge of the typed pipeline is coherent and the
engine underneath can change without touching your setup. The value is the integration
and the seam, not the post-processing itself, and we name Lightning CSS plainly so that
is clear.

The only thing you configure is the evergreen part, your browser `targets`. The core
(default: the Lightning CSS adapter) is swappable behind that surface.

## Composing a custom pre-step (the onion)

Some tokens Lightning CSS cannot fall back, because it does not recognize them (for
example a custom colour-format keyword). For those, gilding composes a pre-step in
FRONT of the inner Lightning CSS core, rather than replacing it. The inner core keeps
doing 100% of its job (fallbacks, prefixes, minification); the pre-step is just a ring
around it (the onion principle, Lightning stays intact).

- `composeCore(preSteps, inner?)` wraps an inner `PostProcessCore` with one or more
  pre-steps. The returned core's `finish` runs each pre-step over the CSS string in
  order, THEN hands the transformed CSS to `inner.finish` with the same evergreen
  config and pass-through options. A pre-step is a pure `(css, evergreen) => css`
  string transform tagged with an optional `preStepName`. `inner` defaults to the
  Lightning CSS core. The composed core's `name` is honest about the composition (for
  example `compose(keyword-to-rgb, lightningcss)`).
- `composeCoreFromFormats(formats, inner?)` is the registry-aware path. Instead of a
  baked-in map, it reads each registered custom format off the `createColor` registry
  and applies that format's declared `ColorFormatPlugin.fallback` transform as a
  pre-step before Lightning. Formats with no `fallback` contribute no pre-step; if none
  declare one, the inner core is handed back untouched (the honest no-op composition).
  Adding a format WITH a fallback to the registry is what causes the rewrite, proving
  it is registry-driven.

`keywordToRgb` is the bundled POC pre-step: a hard-coded keyword->rgb rewrite (`pink`,
`black`, `white`) that demonstrates the seam. It is deliberately narrow, not a general
CSS colour parser; the registry-aware `composeCoreFromFormats` is the un-hard-coded
path.

Status: early (0.x). The Lightning CSS core and the swappable seam are in place.
