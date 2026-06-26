# AGENTS.md - the color lexicon

Scope and boundary for `@css-bookends/color`. Read this before changing anything in
`lexicons/color/`. The global rules are in `/AGENTS.md`; the architecture is in
`/ARCHITECTURE.md`. (`design.md` is a stale pre-culori record and is being rewritten;
do not trust it for current structure.)

## The job (one sentence)

The color lexicon represents a single color and renders it: lenient input, one
canonical OKLCH store, and output in any CSS format through `.css()`.

## The boundary (absolute): value + rendering only, never browsers

The color helper owns the color VALUE and its canonical look. It knows nothing about
browser or display support. Browser compatibility (older-browser fallbacks, vendor
prefixes, wide-gamut `@media (color-gamut)` gating) is owned ENTIRELY by the build-time
post-processing wrapper (browserslist targets -> Lightning CSS), downstream of and
outside this package.

The coherence rule that keeps the two from mismatching: **one place decides each
thing.** The color helper never reasons about browsers; the post-processor never
reasons about color intent. So the color lexicon MUST NOT:

- reason about browser or display support in any way;
- emit `@supports`, `@media (color-gamut)`, or cascade-redeclaration fallbacks;
- carry a fallback, gamut-target, or browser-target config knob;
- gate or refuse output based on support.

A wide-gamut color is emitted as the modern format that faithfully holds it (e.g.
`oklch(...)`); making that safe for old browsers is the post-processor's job, not a
knob here. If you find yourself adding "for old browsers" logic, stop: emit the honest
value and let the wrapper handle compat.

## The surface

- `.css()` - the only renderer (see `/AGENTS.md`), argument-free. It renders the
  configured `output` (a single format, or a priority list that escalates to the
  simplest faithful format; a wide color reaches a modern format only because nothing
  simpler holds it). A one-off format is set beforehand via a selector or
  `.formatAs(...)`, never an argument into `.css()`.
- format selectors (`.hex()`, `.rgb()`, `.oklch()`, ...) - return the color configured
  to that format, still finished via `.css()`; the chosen format brands the output
  (`ColorString<F>`). `.formatAs(...)` does the same for a custom / list format.
- the immutable modification algebra (`darken`, `lighten`, `saturate`, `mix`, ...),
  each returning a new resolved color in the same configured format.

## Config (all value/rendering, none a compat lever)

Factory config (`publishBookColor({ config })`) tunes only how the color represents
itself; none of it touches browser support:

- `output` - which format(s) `.css()` renders. Aesthetic (which source format), NOT a
  compat control. Forcing a single narrow format on a wide color clamps it, so it is
  not the way to "support old browsers" (that is the post-processor's job).
- `strictness` - how a "can't faithfully represent this" case is surfaced
  (throw / warn / silent). It still emits a best-effort value; it does not gate output.
- `transparent`, `omitOpaqueAlpha` - rendering policy.

## Internals (orientation, not contract)

- `src/color.ts` - input -> OKLCH storage -> output; the manuscript + `publishBookColor`.
- `src/types.ts` - the type contract (`ResolvedColor`, `ColorConfig`, ...).
- `src/formats/` - the per-format descriptor registry (`colorFormats`); `escalate.ts`
  (`chooseFormat` + the internal `fits` gamut/alpha check), `internals.ts` (the render
  toolkit), `defineColorSpace` for custom formats. See `src/formats/README.md`.
- `color-space.md` - the CSS value surface (spec, not implementation).

## Quality bars

This package must hit the repo's quality-bar skills: `output-shape`, `smart-factory`,
`type-hardening`, `spec-faithful`. A runtime restriction must also brand the type (see
`type-hardening`): format selectors brand the output (`ColorString<F>`).
