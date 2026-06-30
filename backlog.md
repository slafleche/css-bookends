# CSS-Bookends backlog

The single list of outstanding work. Organised by architecture layer so we can rebuild it up
deliberately: discuss/lock each layer, build it, then systematically check-and-fix each piece.

**Source of truth for the target shape:** `docs/foundations.md` (canonical lexicon from `m()`,
canonical book from `borders`, locked value-surface + validation decisions). The working plan is
`~/.claude/plans/enchanted-meandering-starfish.md`.

**Already real (for context, not outstanding):**
- All ~55 `@css-bookends/*` packages are published on npm `@beta`. `css-calipers`: `latest` 1.0.0,
  `beta` 1.1.0-beta.0.
- Committed + pushed: the factory-pattern work (`2094e46`) + the calipers `1.1.0-beta.0` bump.
- Written this session but UNCOMMITTED: `docs/foundations.md`, `AGENTS.md`, `.claude/CLAUDE.md`,
  3 skills, `books/opacity/README.md`, the plan.

---

## 0. Cleanup (do first)
- [ ] Revert the broken `packages/css-value-core/src/{cssValues,spec,index}.ts` + test edits
      (the wrong string-callable `.value`). That package is non-green until reverted.
- [ ] Commit the uncommitted docs once the architecture is agreed (needs the `commit` trigger).

## 1. Layer 1 — calipers lexicons (conform to the `m()` gold standard)
- [ ] Unify the value accessor to `.value()` + `.unit()` across measurement / integer / float /
      ratio / colour. Keep `.getValue()` / `.getUnit()` as deprecated aliases on measurement.
- [ ] `m()` accepts `number | i | f` inputs (via existing `Scalar` / `toNumber`).
- [ ] Add `.toTypedValue()` (returns the matching `i`/`f`) + `.isInt` / `.isFloat` on the value
      surface.
- [ ] Validation philosophy: `m()` / primitives stay permissive (only non-finite fails); hardening
      (the refinement quartet) is opt-in. (Per-property range rules live in the books — see Layer 2.)
- [ ] Bring `i` / `f` / `ratio` / `colour` to the `m()` structure where they deviate (single
      construction path via factory + one `default.ts`; phantom-symbol branding; refinement quartet;
      shared render helper; file split; runtime + type tests).
- [x] CLOSED: type-through-math (not doing — CSS does not care).

## 2. Layer 1 — packaging split (calipers -> per-primitive packages)
- [ ] New `@css-bookends/core` (shared internals: scalar, toPlainDecimal, measurement infra,
      errors, unitDefinitions, factory).
- [ ] New per-primitive packages: `@css-bookends/measurement` (+ units), `/ratio` (deps core + i +
      f), `/integer`, `/float`, and the colour primitive as `@css-bookends/color` (Layer 1; fold in
      the thin `publishBookColor` wrapper, which only re-exports calipers colour).
- [ ] `css-calipers` becomes the corpus BUNDLE: depends on + re-exports all primitive packages,
      owns `createCalipersBundle` + the default instance. `m()` v1 stays on `latest`.

## 3. Layer 2 — books (conform to the `borders` gold standard)
- [ ] Navigable result surface on every book: drill-in nodes with `.css()` at each, leaves are
      lexicon values. For per-property books: `result.css()` (configured default), `result.value`
      (the typed `i`/`f`, with `.value.css()` / `.value.value()`), `result.style.css()` (the
      `{ prop: value }` object).
- [ ] Wire `format: 'object' | 'string'` (default `'object'`) into the book config + output step.
- [ ] Fix the borders bug: its `output` step drops `cfg`, so its `output: 'long'|'line'|'short'`
      config is ignored. Wire `cfg` through; implement `line` / `short`.
- [ ] Per-property validation per the CSS spec: clamp where the spec clamps (opacity, calc-context),
      otherwise fail fast (don't emit invalid CSS).
- [ ] Bring the vibe-coded books to the borders structure (parse-don't-validate input -> canonical
      store; navigable result; `design.md`; comprehensive tests). The 5 composed-book namespaces
      (shadows / positioning / supports-fallback / backdrop-filter / transforms) stay namespaces.

## 4. Bundles — config cascade
- [ ] `createCalipersBundle` (corpus) config = `{ global?, measurement?, ratio?, integer?, float?,
      color? }`.
- [ ] `publishCompendium` config = `{ global?, <book keys>…, calipers?: CorpusConfig }`, forwarding
      the `calipers` config into `createCalipersBundle` and merging its own `global` under
      `corpus.global`.
- [ ] Cascade resolution: a setting resolves own key -> nearest bundle `global` -> (for a primitive
      via compendium) `compendium.global` -> built-in default.
- [ ] Keep the lazy defaults: `corpus` (bound at defaults) and `@css-bookends/compendium/defaults`.

## 5. Docs / READMEs (Phase D)
- [ ] A README for every package (48 books + lexicons/primitives + bundles + support), each
      fact-checked against its own source; document the `format` option + cascade. Use
      `books/opacity/README.md` as the skeleton.
- [ ] Add `"README.md"` to every package `files` array (currently `["dist"]`, so READMEs don't ship).
- [ ] Republish changed packages under `@beta` at bumped versions (e.g. `0.1.1`).

## 6. Misc
- [ ] Deprecate `@css-bookends/media-queries` on npm (it is live at `0.1.1` on `latest`, NOT
      deprecated, despite being frozen/legacy).
- [ ] Reconcile any remaining stale docs once the split + conformance land.
- [ ] Standalone `css-calipers` git mirror -> `slafleche/css-calipers` (was todo #12; user-run, git
      only).

## 7. Pre-reset tasks to re-evaluate after conformance (paper trail)
These predate the architecture reset and are likely SUBSUMED by the conformance work above; keep
them recorded, re-check once Layers 1-2 are conformed rather than acting on them as-is.
- [ ] Colour doc gaps: omitOpaqueAlpha, strictness, ColorObject, brighten/clone, out-of-gamut
      (was todo #38) — re-evaluate when colour is conformed as a Layer-1 primitive.
- [ ] css-value-core coverage gaps + convert remaining `todo` stubs + add tsd interop type tests
      (was todo #44) — re-evaluate when the per-property books are conformed.

## 8. typesetter: spec it as an onion wrapper around style-dictionary (no code yet)
The bespoke typesetter (`packages/typesetter`) + its `design-tokens.md` / `token-research.md` were
deleted (junk, 2026-06-29) and stay deleted. Per the onion-framework rule the future typesetter
WRAPS **style-dictionary** (the swappable core) with its OWN factory + props, like `gilding` wraps
Lightning CSS. NEXT STEP IS A SPEC, not code — the user wants familiarity with style-dictionary
before forming a strong opinion.
- [ ] Write `docs/typesetter-spec.md`: how style-dictionary works (tokens → transforms → formats),
      its DTCG support, how the typesetter onion-wraps it (`createTypesetter(config)`: evergreen
      config + swappable `core` defaulting to a style-dictionary adapter + `coreOptions`), the seam
      that feeds calipers Layer-1 primitives, and the open trade-offs for the user to weigh.
- [ ] (LATER, after the user has an opinion) implement per the spec.
- [ ] Deprecate the published `@css-bookends/typesetter@0.1.0` on npm (`npm deprecate`, user-run).
- [ ] Scrub remaining `typesetter` mentions in `ARCHITECTURE.md` / READMEs / `AGENTS.md` /
      `.claude/CLAUDE.md` once the spec direction is settled.
