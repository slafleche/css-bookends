# spacing coverage — the value model + the padding/margin split

The contract for the `spacing` LEXICON (the implementation guts shared by the padding and
margin BOOKS; never used alone). For the **full valid CSS surface** of each property see the
pure-spec docs [`padding-space.md`](../../books/padding/padding-space.md) and
[`margin-space.md`](../../books/margin/margin-space.md); this doc is what the lexicon actually models and how
the books compose it.

## Interface (mirrors borders)

- **Scalar = the shorthand** (no `all` key): a bare value means all four sides.
- Object form: axes **`x`** (left + right), **`y`** (top + bottom); sides
  `top/right/bottom/left`. Precedence: **side > axis**.

## The three shared steps (input + storage + output)

The lexicon exposes all three steps; each book wires them into a manuscript + factory.

- **INPUT** — `parseSpacing(input, policy)`: validates the shape + each value against the
  book's policy, returns the input unchanged (shorthand intact).
- **STORAGE** — `resolveSpacing(input)`: spells the shorthand out into the canonical
  four-side `SpacingStore` of **tagged slots** (**partial**: only specified sides; scalar
  fills all four; `x`/`y` fill their axis; explicit side overrides axis). The spell-out
  mechanics are identical for padding and margin, so they are **shared in the lexicon, generic
  over the value type** (the value-domain differences are handled at INPUT).
- **OUTPUT** — `makeSpacingResult(store, cfg, property)`: renders the store into the book's
  result (`.css()` + accessors). Shared, keyed by `property` (`'margin'` / `'padding'`).

### The canonical store: tagged slots (`SpacingSlot`)

Modeled on the colour book's `Store`, each side's value is a discriminated slot, so the
**special words are tagged and emitted verbatim**, distinct from a real length:

```ts
type SpacingSlot<M, K, F> =
  | { kind: 'length'; value: M | 0 }   // a measurement, or the literal 0
  | { kind: 'symbolic'; keyword: K }   // 'auto' | CSS-wide keyword — the special words
  | F;                                 // anchor-size() (already { kind: 'anchorSize' })
```

The **hard auto-split lives here**: padding's slot is `SpacingSlot<NonNegativeMeasurement,
CssWideKeyword, never>`, so a padding store can NEVER hold a `symbolic` `auto` (or a negative,
or an anchor-size). csstype's `(string & {})` escape hatch means the output style type cannot
reject `auto` on its own — the store tag + the input gate are what enforce it.

```ts
parseSpacing(m(8))                     // -> m(8)                  (validated; unchanged)
parseSpacing('auto', { auto: false })  // throws (padding policy)

resolveSpacing(m(8))                   // -> all four sides { kind:'length', value: m(8) }
resolveSpacing({ x: m(4) })            // -> { left, right } both { kind:'length', value: m(4) }
resolveSpacing({ left: 'auto' })       // -> { left: { kind:'symbolic', keyword:'auto' } }
```

### OUTPUT — config + result

```ts
interface SpacingConfig { emit: 'longhand' | 'shorthand'; format: 'object' | 'string' }
//                       default: { emit: 'longhand', format: 'object' }

makeSpacingResult(store, cfg, 'margin').css()
//  longhand+object (default) -> { marginTop:'4px', marginLeft:'8px' }   (only set sides)
//  format:'string'           -> 'margin-top: 4px; margin-left: 8px'
//  emit:'shorthand' (full)   -> { margin: '4px 8px' }                   (1-4 value collapse)
//  emit:'shorthand' (partial)-> falls back to longhand; .shorthand() throws
```

The result also exposes `.longhand()` / `.shorthand()` and `top`/`right`/`bottom`/`left` +
`x`/`y` accessors (calling `()` = the declaration in `format`; `.css()` = the bare value; an
axis `.css()` is the shared value only when both sides are present and equal).

## Value model

A single value is `M | <keyword> | 0 | F`, generic over:

- **`M`** — the measurement type. Default `IMeasurement`; **padding narrows it to
  `NonNegativeMeasurement`** so the non-negative constraint shows up in the type, not just at
  runtime (the governing rule: a runtime restriction must also harden the type).
- **`<keyword>`** — `CssWideKeyword` = `inherit | initial | unset | revert | revert-layer`
  (any property); plus `auto` (margin only).
- **`F`** — extra value kinds: `anchor-size()` (margin only), modeled via the `anchorSize()`
  builder; padding sets `never`.

`calc()` / `min()` / `max()` / `var()` are valid CSS but **not lexicon inputs** — they stay
plain CSS the author writes, coexisting next to helper output (see the `using-calipers`
skill).

## padding vs margin — value-domain split

Grammar: `padding-top = <length-percentage [0,∞]>` (non-negative);
`margin-top = <length-percentage> | auto | <anchor-size()>`. (Full surface: the space docs.)

| Value | `padding` | `margin` |
| --- | :---: | :---: |
| `<length>` / `<percentage>` measurement | yes | yes |
| `0` | yes | yes |
| CSS-wide keywords (`CssWideKeyword`) | yes | yes |
| **negative measurement** | NO (type-hardened to `NonNegativeMeasurement`) | yes |
| **`auto`** | NO | yes |
| **`anchor-size()`** (modeled, margin-only) | NO | yes |

The real differences: the measurement type `M` (padding non-negative), `auto`, and
`anchor-size()` — all handled at INPUT (the `SpacingPolicy` + the `M` generic). The spell-out
(STORAGE) is identical.

## Expandable lexicon

The value types are generic over `M` (measurement), `K` (keyword set), `F` (extra kinds);
`parseSpacing` takes a runtime policy; `resolveSpacing` carries the value type through:

```ts
parseSpacing<M, K, F>(input: SpacingInput<M, K, F>, policy?): SpacingInput<M, K, F>
resolveSpacing<M, K, F>(input: SpacingInput<M, K, F>): SpacingStore<M, K, F>
```

- **margin book**: `SpacingInput<IMeasurement, SpacingKeyword, AnchorSize>`, permissive
  policy `{ auto: true, negative: true, anchorSize: true }`.
- **padding book**: `SpacingInput<NonNegativeMeasurement, CssWideKeyword, never>`, policy
  `{ auto: false, negative: false, anchorSize: false }`; padding's input also hardens each
  measurement through `nonNegative` so the store carries `NonNegativeMeasurement` (Phase 3).

Policy violations throw (strict); at the type level the disallowed kinds are simply absent.

## Status / staging

- **Done:** lexicon INPUT (`parseSpacing` validate-only) **+ STORAGE** (`resolveSpacing`
  spell-out into tagged `SpacingSlot`s — shared, generic over the value type) **+ OUTPUT**
  (`makeSpacingResult` + `slotToCss` + `anchorSizeToCss` + `SpacingConfig` / `SpacingResult` /
  `SpacingStyle`) + the contract (`SpacingValue` / `SpacingObject` / `SpacingInput` /
  `SpacingSlot` / `SpacingStore`, `SpacingPolicy`, `anchorSize()`, the `M` generic). **The
  margin + padding BOOKS are complete** (input + storage + output + `publishBookMargin` /
  `publishBookPadding` factories). Green.
- **Deferred:** `books/positioning` (imports the old `margins()`; breaks on the new
  contract); logical (`padding-inline` / `margin-inline`) emission; the shelf wiring of the
  new books; compile-checked `examples/` (the coexistence wrapper).

## Sources

- Full value surface: [`padding-space.md`](../../books/padding/padding-space.md),
  [`margin-space.md`](../../books/margin/margin-space.md) (this repo; cite MDN + W3C css-box-3/4, css-logical-1,
  css-anchor-position-1).
