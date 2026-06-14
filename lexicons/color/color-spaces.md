# color coverage — spaces, notations, and keywords

The source of truth for the color surface the book covers, on the **make** (input) and
**emit** (output) sides. Goal: **comprehensive, not exhaustive** — cover the mainstream
CSS Color 4 surface, skip the niche. The backing library (culori) is an internal,
swappable detail; this document is the contract.

## Two kinds of value (the key split)

**Rule: if it is a valid CSS color value, we accept it on input.** Every accepted
value is one of two kinds:

- **Translatable** — resolves to a concrete point in a color space. Manipulable
  (darken/mix/hueShift) and convertible to any output format.
- **Symbolic** — a runtime/contextual keyword with no fixed value. You make one and
  **emit it** — it renders its own keyword for ANY requested format (there is nothing
  to convert) — but **modifying it is a violation** (throws in dev / warns in prod, per
  the strictness config).

## Color spaces — translatable (make + emit)

Alpha is `alpha?` everywhere (one name). Storage normalizes every translatable color to
**OKLCH**; output converts back out of OKLCH into the requested format.

| Space | Make: CSS string | Make: structured | Emit format |
| --- | --- | --- | --- |
| named (sRGB) | `'rebeccapurple'` (~148 keywords) | — | via any format |
| hex (sRGB) | `'#3366cc'` / `'#3366cc80'` (3/4/6/8 digit) | — | `hex`, `hexAlpha` |
| rgb (sRGB) | `'rgb(51 102 204)'` | `{ space:'rgb', r,g,b, alpha? }` (r/g/b 0–255) | `rgba`, `rgb` |
| hsl (sRGB) | `'hsl(220 60% 50%)'` | `{ space:'hsl', h,s,l, alpha? }` (s/l 0–100) | `hsl` |
| hwb (sRGB) | `'hwb(220 20% 20%)'` | `{ space:'hwb', h,w,b, alpha? }` (w/b 0–100) | `hwb` |
| lab (CIELAB) | `'lab(50% 40 60)'` | `{ space:'lab', l,a,b, alpha? }` | `lab` |
| lch (CIELAB) | `'lch(50% 40 200)'` | `{ space:'lch', l,c,h, alpha? }` | `lch` |
| oklab (Oklab) | `'oklab(0.5 0.1 0.1)'` | `{ space:'oklab', l,a,b, alpha? }` | `oklab` |
| oklch (Oklab) | `'oklch(70% 0.1 200)'` | `{ space:'oklch', l,c,h, alpha? }` | `oklch` |
| display-p3 | (lenient input only) | — | `displayP3` (`color(display-p3 …)`) |

Plus **re-wrap** of an existing `ResolvedColor`. `transparent` is translatable
(`rgb(0 0 0 / 0)`): fully manipulable; how a fully-transparent color emits is set by
the `transparent` config option (`keyword` / `white` / `black`). There is no
`modern`/fallback format — fallback declarations are a separate property helper's job.

## Special keywords — full surface + handling

| Keyword / category | Kind | Handling |
| --- | --- | --- |
| `transparent` | translatable | parse to `rgb(0 0 0 / 0)`; manipulable; emits per the `transparent` config option |
| named colors (~148) | translatable | parse to sRGB; manipulable + convertible |
| `currentColor` | symbolic | emit the keyword for any requested format; modifying is a violation |
| system colors (current + deprecated) | symbolic | accepted; emit the keyword (light/dark aware at runtime); modifying is a violation |
| CSS-wide keywords | symbolic | `inherit`/`initial`/`unset`/`revert`/`revert-layer` accepted; emit the keyword; modifying is a violation |

**System colors — current (CSS Color 4):** `Canvas`, `CanvasText`, `LinkText`,
`VisitedText`, `ActiveText`, `ButtonFace`, `ButtonText`, `ButtonBorder`, `Field`,
`FieldText`, `Highlight`, `HighlightText`, `SelectedItem`, `SelectedItemText`,
`Mark`, `MarkText`, `GrayText`, `AccentColor`, `AccentColorText`.

**System colors — deprecated (Appendix A), still accepted as symbolic:**
`ActiveBorder`, `ActiveCaption`, `AppWorkspace`, `Background`, `ButtonHighlight`,
`ButtonShadow`, `CaptionText`, `InactiveBorder`, `InactiveCaption`,
`InactiveCaptionText`, `InfoBackground`, `InfoText`, `Menu`, `MenuText`,
`Scrollbar`, `ThreeD*`, `Window`, `WindowFrame`, `WindowText`.

## Out of scope (niche) / lenient input

- **Wide-gamut spaces** `color(rec2020 …)`, `color(prophoto-rgb …)`, `color(xyz …)` are
  not first-class **structured** inputs.
- But input is **lenient**: "if it is a valid CSS color value, we accept it." Anything
  culori can parse (incl. `hwb()`, `color(display-p3 …)`, and the wide-gamut `color()`
  spaces above) is accepted on input and normalized to OKLCH in storage.

## Output formats + alpha/gamut policy

- Formats: `rgba` (default), `rgb`, `hex`, `hexAlpha`, `hsl`, `hwb`, `lab`, `lch`,
  `oklab`, `oklch`, `displayP3`. Output is always the `.css()` terminal; selectors set
  the format.
- Every alpha-capable format ALWAYS renders its alpha slot (`rgba(…,1)`,
  `oklch(… / 1)`); only `rgb` / `hex` (hex6) carry no alpha. The `omitOpaqueAlpha`
  config drops the slot for the optional-alpha formats when the color is opaque.
- One `strictness` knob (factory config; `'auto'` = throw in dev / warn in prod, or
  explicit `'throw'`/`'warn'`/`'silent'`) governs every "can't faithfully represent
  this" case: dropping a non-opaque alpha (`rgb`/`hex`), out of the target format's
  gamut (clamped via `clampChroma`), and modifying a symbolic color.

## make x emit matrix (test grid)

- **Translatable inputs × output formats:** full cross-product over a representative
  color, plus a translucent (alpha) case across the alpha-capable formats.
- **Symbolic inputs:** the keyword passes through on emit for any format; modifying it
  throws.
- **Lenient / wide-gamut input** (`hwb` / `display-p3` / `rec2020`): accepted and
  normalized to OKLCH.

## Deferred (not yet built)

Modification gaps, kept as real failing markers in the matrix until implemented:
`blend.multiply`/`blend.screen` (+ overlay — the old impl was a non-standard alpha
hack, needs a real design), `setLightness`/`setChroma`/`setHue`,
`contrast`/`ensureContrast`, `complement`, `invert`, `grayscale`.

## Sources

- CSS Color Module Level 4: https://www.w3.org/TR/css-color-4/
- MDN `<system-color>`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/system-color
- MDN `<color>` values: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
- web.dev, new color spaces: https://web.dev/blog/color-spaces-and-functions
