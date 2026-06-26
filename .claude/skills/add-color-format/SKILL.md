---
name: add-color-format
description: How to add a custom colour format to calipers end to end (input parse bridge, output render, registration via `createColor`, the typed named selector, the output priority list). Use when adding, reviewing, or extending a custom `ColorFormatPlugin`, or wiring a new format through the colour factory.
---

# add-color-format

Layering first: calipers is **Layer 1** (typed input primitives, standalone, no
helpers). A colour format extends the primitive's own pipeline, not a helper. Read the
canonical three-layer model in `.claude/CLAUDE.md` / `AGENTS.md` before working.

A custom colour format extends the calipers pipeline at the EDGES only: storage stays
canonical OKLCH (not pluggable). A plugin bridges INPUT (`parse`) and OUTPUT
(`render`), and you register it through the `createColor` factory.

The full how-to (mental model, every field, the worked `zoo` example, all four use
forms) lives in `lexicons/calipers/docs/adding-a-color-format.md`. Read it before
writing. This skill is just the procedure and where the facts live.

## Read for the facts

- `lexicons/calipers/docs/adding-a-color-format.md`: the consumer-facing how-to.
- `lexicons/calipers/docs/custom-format-registration.md`: the design and rationale
  (why storage is not pluggable, the factory wiring, the gilding fallback seam).
- `lexicons/calipers/src/color/index.ts`: the real `createColor` factory, the
  per-instance registry, the plugin-aware parser, and the named-selector wiring.
- `lexicons/calipers/src/color/types.ts`: `ColorFormatPlugin`, `ColorConfig`,
  `OutputFormat`, `TransparentRendering`, `ResolvedColor`.
- `lexicons/calipers/src/color/formats/types.ts`: `ColorSpaceDescriptor` (the
  descriptor field shapes) and `defineColorSpace`.
- `lexicons/calipers/tests/runtime/color/custom-format.src.test.ts`: the worked `zoo`
  plugin. Use it as the template for a new format and its test.

## Procedure

1. Author a `ColorFormatPlugin`: required descriptor fields `format`, `render`,
   `hasAlpha`, `gamut`, `supportsProbe`, `gamutDependent`, `srgbFloor`, plus optional
   `parse` input bridge. `hasAlpha` / `gamut` feed output escalation; `supportsProbe`
   / `gamutDependent` / `srgbFloor` feed the gilding fallback seam. `render` converts
   out of OKLCH (e.g. culori `converter('rgb')`); `parse` returns a culori `Color` or
   `undefined` to decline.
2. Register: `const myColor = createColor({ formats: [yourPlugin] })`.
3. Use: input bridge `myColor('flamingo')`, typed selector `myColor(x).zoo.css()`, or
   priority list `myColor(x, { output: [yourPlugin, colorFormats.oklch] }).css()`.
   Registration is per-instance; the module-level `color` does not see it.

## Verify

Extend `lexicons/calipers/tests/runtime/color/custom-format.src.test.ts` with the new
format (mirror the `zoo` round-trip: input bridge, named selector, priority list,
per-instance scoping), then green-gate:

```
npm --prefix lexicons/calipers test
```

Every identifier in any code example MUST match the real source above (`createColor`,
`defineColorSpace`, `ColorFormatPlugin`, `colorFormats`, `.zoo`, `parse`, `render`,
field names). If a draft would not compile against the real API, fix the draft, not
the API.
