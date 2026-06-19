# spacing coverage — the value model + the padding/margin split

The contract for the `spacing` LEXICON (the implementation guts shared by the padding and
margin BOOKS; never used alone). For the **full valid CSS surface** of each property see the
pure-spec docs [`padding-space.md`](./padding-space.md) and
[`margin-space.md`](../../books/margin/margin-space.md); this doc is what the lexicon actually models and how
the books compose it.

## Interface (mirrors borders)

- **Scalar = the shorthand** (no `all` key): a bare value means all four sides.
- Object form: axes **`x`** (left + right), **`y`** (top + bottom); sides
  `top/right/bottom/left`. Precedence: **side > axis**.

## The two shared steps (input + storage)

The lexicon exposes two steps the books compose; output stays each book's own.

- **INPUT** — `parseSpacing(input, policy)`: validates the shape + each value against the
  book's policy, returns the input unchanged (shorthand intact).
- **STORAGE** — `resolveSpacing(input)`: spells the shorthand out into the canonical
  four-side `SpacingStore` (**partial**: only specified sides; scalar fills all four; `x`/`y`
  fill their axis; explicit side overrides axis). The spell-out mechanics are identical for
  padding and margin, so they are **shared in the lexicon, generic over the value type** (the
  value-domain differences are handled at INPUT). [decision: shared storage, not per-book]

```ts
parseSpacing(m(8))                     // -> m(8)                  (validated; unchanged)
parseSpacing({ x: m(4), y: m(8) })     // -> { x: m(4), y: m(8) }  (validated; unchanged)
parseSpacing('invalid')                // throws (invalid value)
parseSpacing('auto', { auto: false })  // throws (padding policy)

resolveSpacing(m(8))                   // -> { top, right, bottom, left } all m(8)
resolveSpacing({ x: m(4) })            // -> { left: m(4), right: m(4) }  (partial)
resolveSpacing({ y: m(8), top: m(2) }) // -> { top: m(2), bottom: m(8) }  (side > axis)
```

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
  spell-out — shared, generic over the value type) + the contract
  (`SpacingValue` / `SpacingObject` / `SpacingInput` / `SpacingStore`, `SpacingPolicy`,
  `anchorSize()`, the `M` generic). Green.
- **Next:** padding + margin BOOKS — input (margin straight from spacing; padding the
  hardened version), then storage (call `resolveSpacing`), then output (Phase 6 discussion).
  See `todo.md`.
- **Deferred:** `books/positioning` (imports the old `margins()`; breaks on the new
  contract); the padding measurement-hardening map helper (Phase 3).

## Sources

- Full value surface: [`padding-space.md`](./padding-space.md),
  [`margin-space.md`](../../books/margin/margin-space.md) (this repo; cite MDN + W3C css-box-3/4, css-logical-1,
  css-anchor-position-1).
