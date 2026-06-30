# Typesetter spec (DRAFT): onion-wrap style-dictionary

Status: SPEC ONLY, no code. The bespoke `typesetter` package was deleted; this proposes rebuilding
it as a thin **onion wrapper around [style-dictionary](https://styledictionary.com)** (the swappable
core), per the repo's onion-framework rule (the same shape `gilding` uses for Lightning CSS). Goal
of this doc: enough grounding in style-dictionary to decide the approach before writing code.

## 1. What it is: a source-agnostic, flexible adapter into the typed system

The job, in one line: take design tokens from ANY source, however quirky or company-specific, and
convert them into the typed calipers system (`m` / `color` / `i` / `f`). The SOURCE is not the
typesetter's concern; the typed OUTPUT is. It is a build-time step (run when the design updates), not
a runtime helper, so it does not render `.css()` itself; the calipers values it emits do.

The flexibility lives in CONFIG SEAMS on the style-dictionary core, so updates / quirks /
company-specific specs are absorbed in config, never hardcoded into the converter:

- **Source-agnostic** — a style-dictionary PARSER ingests whatever format you have (DTCG, Tokens
  Studio export, a company's bespoke JSON) into a normalised dictionary. A new source means a new or
  added parser; nothing downstream changes.
- **Quirks / updates / company spec** — PREPROCESSORS + TRANSFORMS normalise and fix the parsed
  tokens before mapping (rename oddities, coerce units, drop junk, resolve references). A company's
  weirdness lives in a transform, not in the converter.
- **Into your typed system** — the typesetter's mapping turns the normalised, resolved tokens into
  calipers values by `$type` (the table in §4).

```
any source (DTCG / Tokens Studio / bespoke JSON)
   -> parser            (source-agnostic)
   -> preprocess/transform  (absorb updates / quirks / company spec)
   -> map by $type      (the typesetter's calipers seam)
   -> typed calipers values (m / color / i / f)  ->  books / .css()
```
Every arrow is a config seam; the whole thing is `createTypesetter`'s onion wrapping style-dictionary.

## 2. Style-dictionary primer (the core we wrap)

Style-dictionary is a build system: it reads token files, resolves references, runs transforms, and
emits platform outputs via formats. The pieces, in pipeline order:

- **Parsers** turn token files into a JS object (`registerParser`). DTCG JSON is supported natively
  in v4 (`$value` / `$type` / `$description`); you pick DTCG **or** legacy per instance, not both.
- **Preprocessors** mutate the parsed dictionary before transforms (`registerPreprocessor`).
- **Transforms** normalise token values/names/attributes (`registerTransform`, grouped by
  `registerTransformGroup`). Transforms also RESOLVE references between tokens.
- **Formats** turn the transformed dictionary into an output string (`registerFormat`).

Programmatic API (v4) we would use:

```ts
import StyleDictionary from 'style-dictionary';
const sd = new StyleDictionary(config);            // config = object or file path; auto-inits
// in-memory (no files written) — what a library wants:
const tokens = await sd.getPlatformTokens('calipers'); // resolved tokens, post-transform
// or, if we emit via a custom format:
const files = await sd.formatPlatform('calipers');     // [{ output, destination }], no fs write
```

A custom **format** function receives `{ dictionary, platform, options, file }` and returns a string
(non-string allowed via `formatPlatform`/`formatAllPlatforms`). `dictionary.allTokens` is the flat
resolved array; each token has `value` (transformed/resolved), `original.value`, `name`, `path`,
`type`. (`registerFormat({ name, format })`.)

## 3. The onion wrapper (`createTypesetter`)

Mirror `createGilding` (`packages/gilding`): a factory returning a function, with a swappable core
and pass-through core options. The wrapper owns the calipers mapping + emit; style-dictionary owns
parse + resolve + transform.

**Why onionize (the rationale).** We WRAP style-dictionary, we do not reinvent it or claim it as our
own (the same stance `gilding` takes toward Lightning CSS, "we wrap, we don't reinvent or take
credit"). The onion buys two things:
- **Swappable, not a lock-in.** style-dictionary sits behind our `core` seam, so if a better token
  engine appears, or a consumer needs a different one, we swap the core with zero change at the
  consumer's call sites.
- **Our customizations on top.** The wrapper layers OUR behaviour AROUND the core, onion-style: our
  calipers mapping, our emit, our defaults/config, plus any parsers/preprocessors/transforms we add
  for source quirks, all without forking style-dictionary. Their engine does the heavy lifting; our
  value-add lives on the outside.

- **Evergreen config** (the only surface most consumers learn): the token source + how token
  `$type`s map to calipers + the emit shape.
- **Swap seam** `core`: defaults to a style-dictionary adapter; replaceable (the onion's centre), so
  the parser/resolver is not a lock-in.
- **Pass-through** `coreOptions`: forwarded verbatim to the active core (e.g. the raw
  style-dictionary `config`: extra `transforms`, `preprocessors`, etc.). Opaque to the typesetter.

```ts
const typeset = createTypesetter({ /* evergreen config */ });
const output = typeset(tokensDocOrPath);   // -> emitted TS source (or an in-memory map; see §5)
```

## 4. The calipers seam (the real design choice)

Two ways to turn resolved tokens into calipers values:

- **A. Map in the wrapper (recommended).** Use the core to get RESOLVED tokens
  (`getPlatformTokens()`), then the typesetter maps each token to a calipers primitive by `$type`,
  and emits. The calipers knowledge lives in the typesetter; style-dictionary stays a generic
  parse+resolve core (truly swappable). This is the old `convert.ts` mapping logic, but fed by
  style-dictionary instead of a bespoke parser.
- **B. Custom style-dictionary format.** Register a format that walks `dictionary.allTokens` and
  emits TS using calipers calls. Fewer moving parts, but it welds the calipers mapping to
  style-dictionary's format API, so the core is no longer cleanly swappable. Not recommended for the
  onion shape.

Proposed `$type` -> calipers mapping (DTCG types -> Layer-1 primitives):

| DTCG `$type` | calipers value | note |
| --- | --- | --- |
| `dimension` (`{value,unit}`) | `m(value, unit)` | px / rem / etc. |
| `color` | `color('#…')` | hex/rgb/… string in, colour primitive out |
| `number` | `i()` if integer else `f()` | unitless scalar |
| `duration` (`{value,unit}`) | `m(value, 's'\|'ms')` | a measurement with a time unit |
| `fontWeight` | `i()` (or keyword) | numeric weight or the keyword string |
| (others: `cubicBezier`, `shadow`, `typography`, …) | OPEN | composite types map to book inputs, not a single primitive, decide later |

## 5. Output shape (open)

Two emit modes (could support both, config-driven, per the everything-is-config-driven rule):
- **TS source** (what the bespoke one did): `export const` declarations whose values are calipers
  factory calls, written to a file. Build-time codegen.
- **In-memory object**: return `{ tokenName: <calipers value> }` for programmatic use without a file.

## 6. Open questions to decide (the point of this doc)

1. **Seam A vs B** (map-in-wrapper vs custom SD format). Recommendation: A, for a swappable core.
2. **Emit**: TS-source codegen, in-memory map, or both (config-driven).
3. **Composite token types** (`shadow`, `typography`, `cubicBezier`, `border`): these map to BOOK
   inputs, not a single calipers primitive. Does the typesetter handle them (needs the books), or
   only primitive `$type`s (dimension/color/number/duration/fontWeight) for v1?
4. **Reference resolution**: lean on style-dictionary's resolution entirely (yes), or preserve token
   aliases as references in the output? (Probably resolve fully for v1.)
5. **DTCG-only**: support only the DTCG `$`-prefixed format (v1), or also legacy? (Lean DTCG-only.)
6. **Package shape**: `createTypesetter` factory + a thin CLI script (the dev runs it), library-only
   like gilding (no CLI), or both?

## 7. Naming + placement

`@css-bookends/typesetter`, `createTypesetter`, default core = a style-dictionary adapter. Lives in
`packages/typesetter` (rebuilt). `style-dictionary` is a dependency of the default core only (so a
consumer who swaps the core does not pay for it), mirroring how `gilding` isolates `lightningcss`.

## Sources

- Style Dictionary API: https://styledictionary.com/reference/api/
- Custom formats: https://styledictionary.com/reference/hooks/formats/
- DTCG / W3C support: https://styledictionary.com/info/tokens/ and
  https://v4.styledictionary.com/reference/utils/dtcg/
- Config: https://styledictionary.com/reference/config/
