---
name: config-cascade
description: How configurable behaviour flows through CSS-Bookends - every unit (calipers primitive / bookends book) has a factory config, units of a kind share an IDENTICAL config shape, and a bundle (corpus / compendium) carries a `global` plus per-unit keys that resolve unit-key -> global -> factory default. Use when adding or changing ANY config option, a unit factory, or bundle wiring. Always paired with failing-first tests.
---

# config-cascade

The rule for any behaviour that can vary across instances. It makes "everything is
config-driven" (see `docs/foundations.md`) concrete and uniform at both layers. This
is the cascade `createCalipersBundle` (corpus) and `publishCompendium` (compendium)
implement; copy it, never reinvent a per-feature scheme.

## The rules

- **Every unit has a FACTORY that takes a config.** A calipers primitive: `createCalipers`
  (`m`), `createInteger` (`i`), `createFloat` (`f`), `createColor`. A bookends book:
  `publishBook<Name>`. The factory bakes the config into the unit it produces. No bare
  pre-made instance is the configurable path.
- **Units of a KIND share an IDENTICAL config shape.** `m` / `i` / `f` all carry the same
  shared field(s) for a cross-cutting option, typed from ONE shared type, never redefined.
  Example: `Hardening = 'ignore' | 'warn' | 'fail'` + `HardeningConfig` live once in
  `lexicons/calipers/src/hardening.ts` and are imported by the `m` / `i` / `f` factory
  configs. A new shared option is added to that one shared type, then it is automatically
  identical across the units.
- **A bundle exposes `global` PLUS one key per unit.** `CalipersBundleConfig` (corpus):
  `{ global?, measurements?, integer?, float?, ratio?, color? }`. `CompendiumConfig`:
  `{ global?, <book keys>…, calipers?: CalipersBundleConfig }`. The bundle factory must
  return the CONFIGURED units (spread `createInteger(...)` / `createFloat(...)` / … into the
  bundle object), so a `global` or per-unit key actually reaches the unit a consumer calls.
- **Resolution is `unit key -> bundle global -> factory default`** (most specific wins). In
  the user's words: set in BOTH the global and the unit key -> the unit key wins; only the
  global -> use the global; neither -> the factory default. One line per unit, e.g.
  `hardening: config.integer?.hardening ?? config.global?.hardening` (then the factory applies
  its built-in default when that is `undefined`).
- **Bundles NEST; the inner global overrides the outer.** The compendium carries the whole
  corpus config under a `calipers` key and forwards it to `createCalipersBundle`, merging so a
  primitive resolves `own -> corpus.global -> compendium.global -> default`. Build the corpus
  global as `calipers.global.<opt> ?? compendium.global.<opt>` so corpus-specific wins.
- **Reachability is mandatory.** No unit config the bundle factory cannot reach. If you add a
  unit option, you ALSO add it to the bundle config + cascade in the SAME change. An option
  that only works standalone is a bug.
- **The publishBook engine has no global tier.** `self-publish/src/publishBook.ts` merges only
  `defaults <- config`. So per-book global resolution happens INSIDE `publishCompendium` (merge
  the global-applicable fields under each book's own config before calling the factory), and a
  global field is applied only to books whose config actually has it.

## Tests are NOT optional

ANY config or cascade change ships **failing-first** tests (write them, watch them fail, then
implement — see `doc-test-code`). For a cascade, cover every rung, for each unit, at BOTH
bundle levels:

- **unit key wins** over the global,
- **global applies** when there is no unit key,
- **factory default** when neither is set,
- and (for nested bundles) the **inner global overrides the outer**.

Use a real worked option (today: `hardening`) with an observable effect (`ignore` proceeds,
`fail` throws). Tighten throw-assertions to the real message (e.g. `toThrow(/maximum/)`) so a
`TypeError` from an unbuilt API cannot pass spuriously. Reference: corpus cascade tests live in
`lexicons/calipers/tests/runtime/corpus/corpus.src.test.ts`.

## Reference

`lexicons/calipers/src/corpus.ts` (`createCalipersBundle` = the canonical cascade);
`createInteger` / `createFloat` in `lexicons/calipers/src/integer.ts` / `float.ts`;
the shared `Hardening` / `HardeningConfig` in `lexicons/calipers/src/hardening.ts`;
`packages/compendium/src/index.ts` (`publishCompendium`). Companion skills: `doc-test-code`
(build order), `smart-factory` (the factory itself), `output-shape` (the `format` option).
