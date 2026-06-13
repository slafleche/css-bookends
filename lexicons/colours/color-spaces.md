# color coverage — spaces, notations, and keywords

The source of truth for the whole color surface the book must cover, on the **make**
(input) and **emit** (output) sides. The TS input types and the make x emit test
matrix are built from this. Goal: **comprehensive, not exhaustive** — cover the
mainstream CSS Color 4 surface, skip the niche/deprecated. The backing library is
irrelevant and gets rewritten to satisfy this; this is a contract.

## Two kinds of value (the key split)

**Rule: if it is a valid CSS color value, we accept it on input.** Every accepted
value is one of two kinds:

- **Translatable** — resolves to a concrete point in a color space. Manipulable
  (darken/mix/hueShift) and convertible to any output format.
- **Symbolic** — a runtime/contextual keyword with no fixed value. You CAN make one
  and emit it (it renders its own keyword), but **modifying it throws** and it cannot
  be converted to another format. (The current helper already does exactly this for
  `currentColor` / `Highlight`: every modifier throws in dev, warns in prod.)

## Color spaces — translatable (make + emit)

Alpha field is `alpha?` everywhere (one name, not `a` in some and `alpha` in others).

| Space | Make: CSS string | Make: structured | Emit format |
| --- | --- | --- | --- |
| named (sRGB) | `'rebeccapurple'` (~148 keywords) | — | via rgb/hex/etc. |
| hex (sRGB) | `'#3366cc'`, `'#3366cc80'` (3/4/6/8) | — | `hex`, `hexAlpha` |
| rgb (sRGB) | `'rgb(51 102 204)'` | `{ space:'rgb', r,g,b, alpha? }` | `rgb` (css), `rgbLegacy` |
| hsl (sRGB) | `'hsl(220 60% 50%)'` | `{ space:'hsl', h,s,l, alpha? }` | `hsl` |
| hwb (sRGB) | `'hwb(220 20% 20%)'` | `{ space:'hwb', h,w,b, alpha? }` | `hwb` |
| lab (CIELAB) | `'lab(50% 40 60)'` | `{ space:'lab', l,a,b, alpha? }` | `lab` |
| lch (CIELAB) | `'lch(50% 40 200)'` | `{ space:'lch', l,c,h, alpha? }` | `lch` |
| oklab (Oklab) | `'oklab(0.5 0.1 0.1)'` | `{ space:'oklab', l,a,b, alpha? }` | `oklab` |
| oklch (Oklab) | `'oklch(70% 0.1 200)'` | `{ space:'oklch', l,c,h, alpha? }` | `oklch` |
| display-p3 | (not input) | — | `displayP3` (`color(display-p3 …)`) |

Plus `modern` (oklch with rgb fallback) and **re-wrap** of an existing color.
`transparent` is translatable (`rgb(0 0 0 / 0)`): manipulable, and re-emittable as the
`transparent` keyword when alpha is 0.

## Special keywords — full surface + handling

| Keyword / category | Kind | Handling |
| --- | --- | --- |
| `transparent` | translatable | parse to `rgb(0 0 0 / 0)`; fully manipulable + convertible; may re-emit `transparent` when alpha 0 |
| named colors (~148) | translatable | parse to sRGB; manipulable + convertible |
| `currentColor` | symbolic | make + emit the keyword; modifying or converting **throws** (dev) / warns (prod) |
| system colors (current + deprecated) | symbolic | valid color values, so accepted; emit the keyword; light/dark aware at runtime; modifying or converting **throws** (dev) / warns (prod) |
| CSS-wide keywords | symbolic | `inherit`/`initial`/`unset`/`revert`/`revert-layer` are valid color values, so accepted; passthrough (emit keyword; modify/convert **throws**) |

**System colors — current (CSS Color 4):** `Canvas`, `CanvasText`, `LinkText`,
`VisitedText`, `ActiveText`, `ButtonFace`, `ButtonText`, `ButtonBorder`, `Field`,
`FieldText`, `Highlight`, `HighlightText`, `SelectedItem`, `SelectedItemText`,
`Mark`, `MarkText`, `GrayText`, `AccentColor`, `AccentColorText`.

**System colors — deprecated (Appendix A), still accepted as symbolic:**
`ActiveBorder`, `ActiveCaption`, `AppWorkspace`, `Background`, `ButtonHighlight`,
`ButtonShadow`, `CaptionText`, `InactiveBorder`, `InactiveCaption`,
`InactiveCaptionText`, `InfoBackground`, `InfoText`, `Menu`, `MenuText`,
`Scrollbar`, `ThreeD*`, `Window`, `WindowFrame`, `WindowText`. (Deprecated in CSS,
but valid color values, so passed through.)

## Out of scope (niche)

- **Wide-gamut spaces:** `color(rec2020 …)`, `color(prophoto-rgb …)`, `color(xyz …)`
  - color FUNCTIONS, not keywords; conversion-heavy and rarely needed.
- **hwb / display-p3 as INPUT** (output only for now).

## make x emit matrix (test grid)

- **Translatable inputs x output formats:** full cross-product over a known
  representative color (plus an alpha case).
- **Symbolic inputs:** assert the keyword round-trips on emit, and that modifying /
  reformatting throws.
- **Unsupported notations** (hwb/p3 input, deprecated keywords): asserted by their
  current behavior, never skipped.

## Comparison with the current helper (`colorWrap.ts` + `colours.ts`)

### Good (reuse the pattern/logic)
- Immutable wrapper, clone-on-modify.
- The modification algebra: `alpha` (dual get/set), `darken`, `lighten`
  (`brighten` is an alias), `saturate`, `desaturate`, `hueShift(DegMeasurement)`,
  `mix`, `mixSolid`, `solid`, `blend.{multiply,screen}`, `clone`.
- Symbolic colors via a wrapper whose modifiers throw — already the rule we want;
  generalize it from `currentColor`/`Highlight` to the whole system-color set.
- OKLCH conversion + the `CssFormat` discriminated union, `colorFormats`, format
  selectors, and `.css(format)` (in `colours.ts`).

### Needs rework
- **Input:** today `string | Color | wrapper` plus scattered `color.create.{hex,
  rgba,hsl,oklch}` + `color.oklch(obj)` / `color.lch` / `color.fromOKLCH`.
  Consolidate into one discriminated-union-by-`space` (above) + string + re-wrap.
- **Alpha naming:** unify (`OKLCH` uses `a`, culori uses `alpha`, `rgba()` uses an
  alpha arg) -> `alpha?` everywhere.
- **Library leaks in the public surface:** `unsafeChroma`, `unsafeToColor`,
  `value(): Color`, the `Color` re-export -> replace with a lib-agnostic escape
  hatch (or drop). Contract must never name the backing library.
- **Output:** extend `colorFormats` with `hwb`, `lab`, `lch`, `oklab`, `displayP3`.
- **Engine + naming:** `colours.ts` is on the old engine and British spelling ->
  new `manuscript`/`output`/`publishBookColor`, US `Color` spelling.
- **css options bag** (`forceAlpha`/`preferKeywordTransparent`) -> already folded
  into `colorFormats` (`rgbLegacy`/`hexAlpha`); finish the transparent-keyword path.

### Missing (not in the current helper)
- **Structured inputs** for `hwb`, `lab`, `oklab` (only rgba/hsl/oklch + oklch/lch
  objects exist today).
- **String inputs** for `oklab` (and `hwb`/`p3` if ever promoted) - today they throw.
- **System colors beyond `currentColor`/`Highlight`** (the other 17) as symbolic.
- **Output formats** `hwb` / `lab` / `lch` / `oklab` / `displayP3`.

## Files (deprecation)

- **DEPRECATED — reference only, do not extend** (moved into `src/deprecated/`):
  - `src/deprecated/colorWrap.ts` — old wrapper + `color` helper (library-coupled guts).
  - `src/deprecated/colours.ts` — old book (British spelling, old engine, currently broken).
  - `src/deprecated/default.ts` — old default instance.
- **NEW — the rewrite target:**
  - `src/color.ts` — the new color book: the `ColorInput` union, the manuscript, the
    `ResolvedColor` result, the full `colorFormats`, symbolic handling, and
    `publishBookColor`. US spelling. Guts (conversion impl) are internal and
    lib-agnostic.
  - `index.ts` points at the new file once it supersedes the old.

## Sources

- CSS Color Module Level 4: https://www.w3.org/TR/css-color-4/
- MDN `<system-color>`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/system-color
- MDN `<color>` values: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
- web.dev, new color spaces: https://web.dev/blog/color-spaces-and-functions
