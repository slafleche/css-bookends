# colours - design record

The colours helper, documented as it is being reworked toward the factory + book
model (see `/ARCHITECTURE.md` and `books/borders/design.md`). colours is a
deliberate **hybrid**: technically a lexicon (a primitive value type other books
build on), but built with the **structure of a book** so it gains the press
pipeline and multiple output formats.

This file is the spec. Everything marked "supported" is verified by
`tests/runtime/colorWrap.src.test.ts`; everything marked "gap" has an `it.todo` in
that same file, so the doc and the tests stay in lockstep.

Canonical runtime lives in `src/colorWrap.ts` (kept as-is). The book wiring
(`src/colours.ts`, `bookPressColours`) is built (pass 1) and delegates entirely to that
wrapper; a later pass rewrites the internals (a backing-library swap, see `notes.md`).

| Page | Status |
| --- | --- |
| Structure (book shape) | Built (pass 1: `bookPressColours` delegates to `colorWrap`) |
| 1. Input | Implemented via `color()` + `color.create.*` |
| 2. Storage + modifications | Implemented (immutable `ColorWrapper`) |
| 3. Output | Implemented (several formats), some still reach through `unsafeColor` |

---

## Structure (the book shape)

colours is stamped from the same `bookpress` press as a book, even though it is a
lexicon. The hybrid: a book-shaped shell (press pipeline, factory config, multiple
outputs) with a lexicon-grade value algebra living on the resolved result.

- **Input (page 1):** the permissive edge. Any colour expression maps to one
  canonical store. Delegates to the existing `color()` / `color.create.*`.
- **Storage (page 2):** the canonical value is the existing immutable
  `ColorWrapper`. The chainable modifications (darken, mix, ...) are storage-stage
  operations exposed on the resolved result; each returns a new resolved colour.
- **Output (page 3):** the final output is always `.css()` (the only renderer).
  The format is a typed object, `CssFormat` (a discriminated union keyed by
  `format`), supplied from the `colorFormats` presets, never a raw string. Choose
  it by `config.output`, by argument (`.css(colorFormats.hex)`), or via a format
  selector that returns the colour (`.hex().css()`). No method renders a string
  per format.

Built surface (pass 1, in `src/colours.ts`):

- `bookPressColours(config)` - the factory (bookPress + press), config = default output
  format (`output`), base colour (`base`), and `cssOptions`.
- A `ResolvedColour` returned per call: the single render terminal
  `.css(format?: CssFormat)` (format defaults to `config.output`), format
  selectors (`.hex()/.rgb()/.hsl()/.oklch()/.modern()`, with typed options like
  `.hex({ alpha: true })`) that return the colour configured to that format, the
  transform algebra, and `wrapper()` as an escape hatch to the `ColorWrapper`.
- `colorFormats` - named `CssFormat` presets (`css`, `rgb`, `rgbLegacy`, `hex`,
  `hexAlpha`, `hsl`, `oklch`, `modern`). Pass these to `.css()` / `output`.

Each colour modification is treated as a NEW colour object. This is already how
`ColorWrapper` behaves (it clones before every mutation), so the book adds no new
cost beyond a small adapter allocation.

---

## 1. Inputs

### Supported

| Input | Form | Notes |
| --- | --- | --- |
| CSS string | `color('rebeccapurple')`, `color('#ff0000')`, `color('rgb(255,0,0)')` | any CSS color string the parser accepts (named, hex, rgb/rgba, hsl, oklch, lab, lch) |
| Hex | `color.create.hex('ff0000')` | bare or `#`-prefixed |
| RGB(A) | `color.create.rgba(r, g, b, a?)` | channels accept 0-255 or 0-1; alpha optional |
| HSL(A) | `color.create.hsl(h, s, l, a?)` | s/l accept percent or 0-1; hue normalized |
| OKLCH | `color.create.oklch('70% 0.1 200')` or `color.create.oklch(l, c, h, a?)` | string or numbers |
| OKLCH object | `color.oklch({ mode:'oklch', l, c, h })`, `color.fromOKLCH(...)` | object form |
| LCH | `color.lch(l, c, h)` | from l/c/h numbers |
| Existing colour | `color(wrapper)`, `color(rawColor)` | idempotent re-wrap |
| Symbolic | `color('currentColor')`, `color('highlight')` | passed through untouched; not manipulable |
| Escape hatches | `color.from`, `color.wrap`, `color.fromCss`, `color.unsafeChroma`, `color.unsafeToColor` | |
| Scale | `color.scale([stops])` | returns a scale, not a wrapper |

### Gaps (missing / proposed)

- **Bare OKLCH object into `color()`.** Today `color()` takes string / Color /
  wrapper only; an `{ l, c, h }` object must go through `color.oklch`.
- **"transparent" as a symbolic input keyword.** It is currently parsed to
  `rgb(0 0 0 / 0)`; the keyword can only be re-emitted on output.
- **hwb() and display-p3 `color()` string inputs** (today they throw; lab/lch
  already parse and are supported).

---

## 2. Modifications

All modifications are immutable: they return a new colour and never mutate the
receiver. Most operate in OKLCH space.

### Supported

| Modification | Signature | Notes |
| --- | --- | --- |
| alpha (get) | `c.alpha()` | returns the number |
| alpha (set) | `c.alpha(v)` | returns a new colour |
| darken | `c.darken(v?)` | OKLCH lightness down; `v` omitted = full |
| lighten | `c.lighten(v?)` | OKLCH lightness up |
| brighten | `c.brighten(v?)` | alias of `lighten` |
| saturate | `c.saturate(v?)` | OKLCH chroma up (gamut-aware max) |
| desaturate | `c.desaturate(v?)` | chroma down; `desaturate(1)` = grayscale |
| hueShift | `c.hueShift(m(deg))` | rotate hue; takes a calipers degree measurement |
| mix | `c.mix(target, ratio?, mode?)` | blend toward target |
| mixSolid | `c.mixSolid(target, ratio?, mode?)` | mix after forcing alpha to 1 |
| blend.multiply | `c.blend.multiply(opts?)` | alpha-keying blend (defaults to white strip) |
| blend.screen | `c.blend.screen(opts?)` | alpha-keying blend (defaults to black strip) |
| solid | `c.solid()` | force alpha to 1 |
| clone | `c.clone()` | isolated copy |
| value | `c.value()` | underlying raw color (escape hatch) |
| mixWithAlpha | `mixWithAlpha(base, target, ratio, alpha?)` | free helper: mixSolid then set alpha |

### Gaps (missing / proposed)

- **Absolute setters:** `setLightness` / `setChroma` / `setHue` (only relative
  shifts exist today; `alpha(v)` is the one absolute setter).
- **Contrast tools:** `contrast` / `ensureContrast` (WCAG-aware adjustment).
- **Conveniences:** `complement` (hue + 180), `invert`, `grayscale` (today spelled
  `desaturate(1)`).
- **More blend modes** beyond multiply / screen (overlay, etc.).

---

## 3. Outputs

"Typed colour in, plain CSS string out." A colour has several valid renderings;
the book exposes them as named formats.

### Supported

| Output | Call | Example |
| --- | --- | --- |
| css (default) | `c.css()` | `rgb(51 102 204)` (modern, space-separated; adds `/ a` when alpha < 1) |
| css forceAlpha | `c.css({ forceAlpha: true })` | `rgba(51, 102, 204, 1)` (legacy comma form) |
| css transparent keyword | `c.css({ preferKeywordTransparent: true })` | `transparent` when alpha is 0 |
| hex | `c.unsafeColor.hex()` | `#3366cc` (reaches through `unsafeColor` today) |
| hsl | `c.unsafeColor.css('hsl')` | `hsl(220deg 60% 50%)` (reaches through `unsafeColor` today) |
| oklch object | `color.toOKLCH(c)` (l 0-1), `toModernOKLCH(c)` (l 0-100) | plain object |
| oklch string | `fmtOKLCH({ l, c, h })` | `oklch(50.000% 0.1000 200)` |
| oklch -> rgb string | `oklchToRgbString({ l, c, h })` | `rgb(0 116 122)` |
| modern | `colorModern(c)` | `oklch(...)` with rgb fallback when not convertible |
| fallback | `colorFallback(c)` | `rgb(51 102 204)` |

The table above is the wrapper-level reality. The **book** unifies all of these
under the single renderer `.css()`. The format is a `CssFormat` object from the
`colorFormats` presets (e.g. `colorFormats.hex`, `colorFormats.rgbLegacy`,
`colorFormats.hexAlpha`), never a raw string. Pick it by config
(`config.output`), by argument (`c.css(colorFormats.hex)`), or by selector
(`c.hex().css()`). Selectors return the colour (not a string) and the chosen
format persists through later modifications; no method renders a string per
format.

### Gaps (missing / proposed)

- **Alpha-aware hex** (`#rrggbbaa`) as a `.css('hex')` variant.
- **lab() / lch() / display-p3 / `color()` function outputs.**
- **Modern + `@supports` fallback pairing** (may belong to the supports-fallback
  book rather than here).

---

## Tests

Two files form the contract:

- `tests/runtime/colorWrap.src.test.ts` - the wrapper contract:
  - `colours - inputs (supported)` covers the Inputs table.
  - `colours - modifications (supported)` covers the Modifications table.
  - `colours - outputs (supported)` covers the Outputs table.
  - `colours - gaps (not yet supported)` holds an `it.todo` per gap above; convert
    each to a real assertion as it is implemented.
- `tests/runtime/colours.book.src.test.ts` - the book contract: `bookPressColours`
  factory + bare call, `.css()` rendering `config.output` (and `.css(format)`
  overriding per call), and modifications returning navigable resolved colours.

Run: `npm test` (42 passing, 10 todo; also builds CJS/ESM, type-checks, lints).
