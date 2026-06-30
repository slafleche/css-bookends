# CSS-Bookends foundations

The canonical structure every package conforms to. There are two gold standards, both
file-verified, and everything else is brought to them:

- **`m()` (`lexicons/calipers`, the measurement value type) is the gold-standard LEXICON.**
- **`borders` (`books/borders`) is the gold-standard BOOK.**

Anything that predates this and diverges was vibe-coded; treat divergence as debt to fix, not a
precedent to copy. When in doubt, open `m()` or `borders` and match it.

---

## First principle: everything is config-driven

A behaviour that could reasonably vary is a CONFIG OPTION, not a hardcoded decision. When the
design forces a "should it do X or Y?" question, the answer is almost always "neither — it's a
config" with a sensible default. Examples in play: output shape (`format: 'object' | 'string'`),
out-of-range handling (`outOfRange: 'throw' | 'clamp'`), and how `m` reacts to a lost/broken
hardening (`'ignore' | 'warn' | 'fail'`).

- Expose the behaviour as an explicit, enumerated, named config value; never bake one branch in.
- Ship a sensible DEFAULT (the most useful real behaviour), fully overridable.
- The option MUST be reachable from the bundle factory (`createCalipersBundle` / `publishCompendium`)
  under the matching key, with the cascade (own -> bundle global -> default). No unit config the
  bundle factory cannot reach. (See the `doc-test-code` skill's config rule.)

---

## Canonical LEXICON (the `m()` template)

A lexicon is a typed CSS input value type (measurement, ratio, integer, float, colour). Reference:
`lexicons/calipers/src/core.ts`, `internal/createCoreApi.ts`, `factory.ts`, `default.ts`.

1. **Single construction path.** A `create<Lexicon>(config)` factory builds the instance;
   `default.ts` calls it once with no config and re-exports the bare helpers. The default and any
   custom instance share one builder, so they cannot drift. (`factory.ts:23-35`, `default.ts`.)
2. **Phantom branding via module-private `unique symbol`s.** Unit and constraint brands are keyed
   by private symbols declared in `core.ts`; they are asserted only at one controlled construction
   point (`createCoreApi.ts` `createMeasurement`) and cannot be forged from outside. (`core.ts:38-70`.)
3. **Refinement quartet.** Constraints expose `is` (guard) / `ensure` (throw) / `check` (result) /
   `hardenWith` (fallback), all built by one `make<…>Refinement`. Brands are ADDITIVE on success
   and DROPPED by arithmetic (a result can cross a bound), so derived values must be re-checked.
   (`core.ts:153-182`.)
4. **Immutable value, single `.css()` terminal.** Private fields; every method returns a NEW
   instance. `.css()` is the only renderer, via the shared `toPlainDecimal` (no exponential
   notation in CSS). `.valueOf()` / `[Symbol.toPrimitive]` give number coercion.
5. **Shared `Scalar` arithmetic interop.** Arithmetic accepts `Scalar = number | IInteger | IFloat`
   via one `toNumber` (`scalar.ts`); no duck-typing.
6. **Error-config store, separate from core logic.** `createErrorConfigStore` holds per-instance
   config (e.g. `stackHints`), settable at runtime, with a global fallback. (`internal/errors.ts`.)
7. **Central metadata registry.** Units live in one `UNIT_DEFINITIONS` registry; builders reference
   it, never hardcoded strings; types derive from it. (`unitDefinitions.ts`.)
8. **Strict file split.** `core.ts` (types only) · `internal/create*.ts` (impl + factories) ·
   `factory.ts` (public entry) · `default.ts` (assembly, no logic) · barrels + subpaths.
9. **Tests: runtime + type split.** vitest `*.src.test.ts` for behaviour, tsd `*.test-d.ts` for
   narrowing / brand non-forgeability / unit safety, with shared harnesses across src/cjs/esm.

### The value surface (what a lexicon value exposes)

`m()` / `IMeasurement` (`core.ts:72-105`): render `.css()` / `.toString()`; raw `.getValue()` /
`.getUnit()` / `.valueOf()`; predicates `.isUnit` / `.assert*` / `.equals` / `.compare`; arithmetic
`.add` / `.subtract` / `.multiply` / `.divide` / `.double` / `.half` / `.negation` / `.absolute`
(hardened `>=0`) / `.round` / `.floor` / `.ceil` / `.clamp`.

`i()` / `f()` (`integer.ts:13-25`, `float.ts:13-25`) expose `.css()`, `.value()` (the raw number),
`.valueOf()`, `.constraints()`, `.withValue()`, and the same `Scalar` arithmetic.

### Unified value-surface decisions (locked 2026-06-27)

The accessors were inconsistent (measurements `.getValue()`/`.getUnit()`; scalars `.value()`;
ratio `.numerator()`/`.denominator()`). The conformance target:

- **One raw/unit accessor across all value types: `.value()` (raw) + `.unit()` (unit string,
  empty for unitless).** Measurements keep `.getValue()`/`.getUnit()` as DEPRECATED aliases for
  back-compat. So `result.value.value()` / `result.value.unit()` are uniform whether the leaf is
  a scalar or a measurement.
- **`m()` accepts `number | i | f`** (via the existing `Scalar` / `toNumber`), not just `number`.
- **Interconversion helpers on every value:** a generic `.toTypedValue()` (returns the matching
  `i()`/`f()`) plus `.isInt` / `.isFloat` queries (modelled on the colour object's queries), so a
  value can be recovered as a typed scalar through `.value`.
- **CLOSED, not doing: type-through-math.** Values keep their kind through arithmetic. CSS does
  not care about an int-vs-float distinction (helpers already convert via config), so we do NOT
  add kind-changing arithmetic (`i(4).multiply(4.5555)` does not become a float).

### Validation and hardening philosophy (locked 2026-06-27, CSS-spec-grounded)

Per the CSS Values and Units Module L4 range-checking rules: an out-of-range numeric value makes
the declaration **invalid (ignored) by default**, "unless otherwise specified"; values produced by
`calc()` / interpolation / animation are **clamped** to range; and specific properties clamp by
spec (e.g. `opacity` -> `[0,1]`). So the spec defines clamp-or-invalidate per property.

The conformance rules that follow:

- **Validation lives in the HELPER (book), not in `m()` / the primitives.** A book knows its
  property's spec rule and applies it: **clamp where the spec clamps** (opacity, calc-context),
  otherwise **fail fast** (throw) rather than emit CSS the browser would reject (a typed-input
  library cannot "silently ignore" like the cascade does). This is the existing
  `outOfRange: 'throw' | 'clamp'` knob, defaulted per the property's spec behaviour.
- **`m()` / the primitives stay PERMISSIVE.** Only truly-invalid input (non-finite) fails; range
  rules are not their job. Ordinary in-range variation (an opacity moving 1 -> 0.4) is never an
  error.
- **Hardening is OPT-IN.** `m()`'s refinement quartet, and `hardenInteger`/`hardenFloat` on
  `i`/`f`, let a consumer add strict bounds when they want them; it is never forced.

### Hardening: config-driven reaction to loss / breach (locked 2026-06-29)

Each value type keeps its existing hardening tools: `hardenInteger` / `hardenFloat` on the scalars
(runtime bounds, re-validated through arithmetic, exposed via `.constraints()`), and `m`'s
refinement quartet (`nonNegative` / `nonPositive` / `inRange`) for hardening a measurement directly.
`m` does NOT get its own construction bounds (`m(v, {min,max})`) or a `hardenMeasurement` — to bound
a measurement you either harden the scalar first and pass it in, or use `m`'s quartet.

`m()` accepts `number | i | f`. When it ingests a HARDENED `i`/`f`, `m` CARRIES the bound (exposed
as a runtime `.constraints()`); ingestion itself is silent (nothing is lost, it is kept). What
happens when later ARITHMETIC on that hardened `m` crosses (breaks) the carried bound is
**config-driven** (per the first principle), one knob with three values:

- `'ignore'` → proceed, drop the (now-violated) constraint silently;
- `'warn'` → proceed, but warn that the guarantee was broken;
- `'fail'` → throw (disallow the breaking operation).

So `fail` gives the `i`/`f`-style enforce-through-math, `ignore` a loose drop, `warn` the middle. An
in-bounds operation keeps the constraint; ingesting an UNHARDENED scalar carries nothing. The config
lives on `CalipersFactoryConfig` (today `{ errorConfig? }`) and is reachable from
`createCalipersBundle` under the `measurement` key + the `global` cascade. (Key name + default still
being finalised; lean default `warn`.)

### Colour is a Layer-1 calipers primitive (locked 2026-06-27)

The colour VALUE (parse/store/resolve, `colorFormats`, types) lives in `@css-bookends/css-calipers`
already; the separate `@css-bookends/color` package is only a thin `publishBookColor` wrapper that
re-exports it. When calipers splits, the colour primitive becomes the `@css-bookends/color` package
(a Layer-1 calipers primitive, using `createColor`), and the thin wrapper is folded in. Colour is a
LEXICON, not a Layer-2 book.

---

## Canonical BOOK (the `borders` template)

A book is a helper that turns typed lexicon inputs into CSS for one concern. Reference:
`books/borders/src/borders.ts`, `src/types.ts`, `design.md`.

1. **Manuscript + `publishBook`.** A book is a `Manuscript { defaults, input, storage, output }`
   passed to `publishBook` (from `@css-bookends/self-publish`), which returns the
   `publishBook<Name>` factory. No pre-made instance. (`borders.ts:303-313`.)
2. **input = PARSE, don't validate.** Accept many raw shapes (shorthand, per-side, axis, complex)
   and merge them by SEMANTIC precedence into a canonical `Store`. The store cannot represent an
   invalid state, so storage and output never re-check. (`borders.ts:130-249`.)
3. **storage = the canonical `Store` is the source of truth.** Often a near no-op when input already
   normalised. Concrete leaves, no ambiguous optionals. (`borders.ts:40-64`.)
4. **output = a NAVIGABLE result.** Drill-in nodes (`.top` / `.right` / `.nw` / …) with `.css()` at
   every node, and **the leaves are LEXICON VALUES** (`IMeasurement`, `ResolvedColor`, `i`/`f`) that
   carry their own `.css()` / `.value()`. So `borders(x).top.width.css()` drills whole → edge →
   value → string. (`types.ts:125-149`, `borders.ts:253-299`.)
5. **Output VARIANTS by config.** A config field selects the emitted shape — borders'
   `output: 'long' | 'line' | 'short'`; the per-property analogue is `format: 'object' | 'string'`.
   **The output step MUST receive `cfg` and switch on it.** Borders has a LIVE BUG here:
   `output: (store) => build(store)` drops `cfg`, so its `output` config is ignored and only `long`
   renders. Fix shape: `output: (store, cfg) => build(store, cfg)`. (`borders.ts:310-312`.)
6. **Typed boundary: loose in, strict out.** Permissive input types; a fully-typed config; a
   canonical typed `Store` in the middle; output typed against csstype `Property.*`.
7. **Peer-depend on lexicons; self-instantiate.** A book peer-depends on the lexicons it uses and
   builds its OWN instances via their factories for defaults (`const color = publishBookColor()`),
   never importing a pre-made singleton, and never requiring a lexicon config be passed in. This
   keeps books decoupled from lexicon config surface. (`borders.ts:1-28`, `package.json`.)
8. **A `design.md` decision record + comprehensive tests** (merge, precedence, drill-in), not just
   the happy path.

### The book result surface (resolves the per-property case)

Because leaves are lexicon values, a PER-PROPERTY book (opacity, zIndex, …) whose single leaf is a
scalar exposes:

- `result.css()` → the CONFIGURED `format` default (`'object'` → `{ opacity: '0.5' }`, `'string'`
  → `'0.5'`). The single render terminal.
- `result.value` → the lexicon value itself (the `i`/`f`), so `result.value.css()` → `'0.5'` and
  `result.value.value()` → the raw number. "The value is always an `i` or `f`."
- `result.style.css()` → the property-keyed style object (`{ opacity: '0.5' }`).
- No `.toString()` on the book result surface.

Both forms are always reachable; `format` (resolved via the bundle cascade) only decides what the
top-level `.css()` returns. Multi-property books additionally keep borders-style drill-in and a
decomposition variant.

---

## What vibe-coded units lack (the conformance checklist)

A lexicon or book is NON-conforming if it:

- builds bare helpers outside the single factory/`default.ts` path (defaults drift);
- uses forgeable brands / public constructors instead of phantom symbols;
- mutates in place instead of returning new instances;
- has only throw-or-nothing instead of the refinement quartet;
- duplicates `.css()` / render logic instead of the shared helper;
- (book) returns a FLAT result instead of a navigable one with lexicon-value leaves;
- (book) drops `cfg` in the output step so config is ignored (the borders bug);
- (book) validates strict input instead of parsing permissive input into a canonical store;
- requires a lexicon config to be threaded in instead of self-instantiating;
- ships no `design.md` and only happy-path tests.

Bringing every lexicon and book to this checklist is the conformance work; see the architecture
plan for sequencing (output `format` + config cascade, the calipers package split, per-package
READMEs).
