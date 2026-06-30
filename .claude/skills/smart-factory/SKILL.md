---
name: smart-factory
description: How a CSS-Bookends book's factory should behave - bound via `publishBook<Name>` with a SMART default config (best out of the box, fully overridable), no pre-made instance, a library-agnostic public surface, and configurable strictness with fail-fast errors. Use when adding or reviewing a book's factory, default config, or error/strictness handling.
---

# smart-factory

A book is obtained ONLY through its `publishBook<Name>` factory: the override seam and
the home of smart defaults. Modeled by `publishBookColor`. This is the how-to for the
"consume from a factory" rule in `AGENTS.md`.

## The rules

- **Bind via `publishBook<Name>`, never a pre-made instance.** The package exports the
  factory (plus value builders / composition helpers); a consumer binds once
  (`const color = publishBookColor()`) and calls it. No default-instance export.
  - **Composed-book exception (closed list).** Five books are multi-function utility
    namespaces, not single value->CSS manuscripts, so they expose NO factory:
    `shadows`, `positioning`, `supports-fallback`, `backdrop-filter`, `transforms`. Their
    surface is the namespace of pure functions, and they ALSO ship no bound instance / no
    default export. A new per-property / per-value book is NEVER a namespace; it is a
    `publishBook<Name>` factory. Do not grow this list.
- **Ship a SMART default config.** The out-of-the-box default is the most useful real
  behavior, not a placeholder, and is fully overridable via
  `publishBook<Name>({ config })`. Export the default so consumers can reference or
  extend it (color's default is the fidelity-escalation `defaultFormatPriority`).
  ```ts
  const color = publishBookColor();                                // smart default
  const custom = publishBookColor({ config: { output: [...] } });  // override
  ```
- **Library-agnostic public surface.** The backing library (culori, chroma, ...) is
  named ONLY inside the canonical store; author-facing types never expose it. This is
  the entire point of the seam: swap the backing library with zero call-site change.
  `color/types.ts`: "culori is referenced only by the internal `Store.color`; the
  author-facing types never name it."
- **Configurable strictness + fail-fast errors.** When the book cannot faithfully
  represent something (dropped alpha, out-of-gamut), surface it via a `strictness`
  config knob (`auto` = throw in dev / warn in prod, plus `throw` / `warn` / `silent`),
  still producing a best-effort value in the warn case. Other invalid input fails fast
  with a named / coded error (calipers' `CALIPERS_E_*`). color's `strictness` /
  `violate()` is the pattern.
- **Everything is config-driven (first principle).** A behaviour that could reasonably vary is a
  config OPTION (explicit enumerated value + sensible default), never a hardcoded decision. When a
  design forces "should it do X or Y?", make it a config. See `docs/foundations.md` + `doc-test-code`.
- **Output shape via `format: 'object' | 'string'`.** Every book's config carries this
  (object = property-keyed style object, string = bare value; default `'object'`). The output
  step switches on it. See `output-shape`.
- **Three-tier config cascade (bundle level).** The BUNDLE factories (`publishCompendium`,
  `createCalipersBundle`) take `{ global?, <unitKey>? }`: a `global` slot of shared options plus
  one optional key per unit. Each unit resolves every setting as `own keyed config -> bundle
  global (where applicable) -> built-in default`. So a value set once in `global` (e.g.
  `format: 'string'`) applies to all units unless a unit overrides it. A standalone
  `publishBook<Name>({ config })` just uses `own -> default` (no bundle in play).

## Reference

`publishBookColor` + `defaultColorConfig` / `defaultFormatPriority` in
`lexicons/color/src/color.ts`; the factory rule in `AGENTS.md` and `ARCHITECTURE.md`.
