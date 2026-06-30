---
name: doc-test-code
description: The build order for any non-trivial change in CSS-Bookends — FIRST document the goal/value space, THEN write failing tests, THEN write the code. Includes the config rule (a new/changed config option's shape is discussed and ALWAYS wired into the master/bundle factory with the cascade). Use before implementing any value type, book, feature, or config change.
---

# doc-test-code

The order every non-trivial change follows in this repo. It puts a DOCUMENT-FIRST step in front
of the repo's existing "Test-first, always" rule (`.claude/CLAUDE.md`). Do not skip or reorder.

## 1. Document the goal / value space FIRST

Before any code or tests, write down WHAT we are covering and WHY: the value space (which CSS
values / properties, which inputs are valid, which are out of scope), the intended surface, and the
decisions with their rationale. Where it goes:

- architecture-level: `docs/foundations.md` (the canonical lexicon/book shape + locked decisions);
- per-value-surface: the property's `*-space.md` / `surface.md` (see the `space-doc` skill);
- per-book / per-lexicon: its `design.md` decision record.

If the shape is not documented, it is not ready to build. This is also where a config option's
SHAPE is decided (see the config rule below).

## 2. Write FAILING tests SECOND

Encode the documented goal as tests and confirm they are RED before writing any implementation —
the failing test is the spec (see "Test-first, always" in `.claude/CLAUDE.md`).

- Runtime behaviour: vitest `*.src.test.ts`.
- Type-level guarantees: tsd `*.test-d.ts`. A type-level change MUST have a tsd test that does NOT
  compile against the old types (a runtime test that is green from the start does not validate it).
- Never `it.skip` / `it.todo` / an always-passing assertion. A deliberately-failing stub must stay
  RED and visible (`expect.fail(...)`). Confirm the red by running the test before implementing.

## 3. Write the code THIRD

Implement only enough to turn the red tests green. Then run the package gate (build + test + tsc +
lint) and report status accurately — never call it done while anything is red.

## The config rule (absolute)

First principle: **everything is config-driven.** A behaviour that could reasonably vary is a config
OPTION (an explicit, enumerated value with a sensible default), NOT a hardcoded decision. When the
design forces a "should it do X or Y?" question, the answer is almost always "neither — it's a
config." Don't bake one branch in. (See `docs/foundations.md`.)

When a change adds or changes a CONFIG option on any unit (a lexicon or a book):

- **Discuss / decide the config SHAPE first** (key name, type, default) and document it (step 1).
- **It ALWAYS must be reachable from the master / bundle factory.** A unit config the bundle
  factory cannot set is a bug. Wire the new key into:
  - `createCalipersBundle` (corpus) for a calipers primitive — under that primitive's key
    (`measurement` / `ratio` / `integer` / `float` / `color`), plus the `global` slot if it applies
    across units;
  - `publishCompendium` for a book — under that book's key (and `calipers` for the calipers layer),
    plus the `global` slot.
- Honour the cascade: a setting resolves `own key -> bundle global -> built-in default` (see
  `AGENTS.md` / `docs/foundations.md`).

## Reference

`.claude/CLAUDE.md` ("Test-first, always"), `docs/foundations.md` (canonical shape + decisions),
`space-doc` (the value-space doc), `smart-factory` (factory + config + cascade), `AGENTS.md`.
