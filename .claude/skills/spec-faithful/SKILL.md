---
name: spec-faithful
description: The CSS-Bookends faithfulness rule - a book covers the FULL valid CSS value surface for its concern and does not gate output, including passing special keywords (currentColor, CSS-wide inherit/initial/unset, none/auto, system colors) through verbatim rather than rejecting them. Use when designing a book's input contract or deciding what to accept or reject.
---

# spec-faithful

"If CSS allows it, you can emit it." A book must not artificially restrict the valid
value surface of its concern. The map of that surface is the concern's
`<name>-space.md` doc (see `space-doc`); the book covers it.

## The rules

- **Cover the full valid surface.** Design the input contract against the concern's
  `-space.md` (every value type, keyword, functional notation, CSS-wide keyword). Do
  not silently drop parts of the spec; anything deferred is tracked in the coverage
  doc / `notes.md`, never pretended-covered. (This is the rule the legacy
  media-queries book fell short of.)
- **Pass special keywords through verbatim.** Values with no canonical numeric form -
  `currentColor`, system colors, CSS-wide `inherit` / `initial` / `unset` / `revert` /
  `revert-layer`, `none`, `auto` - are ACCEPTED and emitted as-is, never rejected. They
  carry no value to normalize, so they pass through storage untouched; operating on
  one (e.g. modifying a symbolic color) is a strictness violation, not a silent
  failure. See color's `SYMBOLIC_KEYWORDS`.
- **Do not gate the output.** Emit valid CSS even outside the "happy path" vocabulary;
  the goal is faithfulness to the spec, not a curated subset.

## Reference

`lexicons/color/src/color.ts` (`SYMBOLIC_KEYWORDS`, symbolic passthrough), the
`<name>-space.md` value-surface docs, the `space-doc` skill, the README thesis.
