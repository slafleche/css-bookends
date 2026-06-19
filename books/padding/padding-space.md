# padding value surface

The valid CSS value surface for the `padding` shorthand and its longhands, per the spec.
Implementation-agnostic; what the padding book actually covers is tracked in the book's
coverage doc and tests. (Draft lives here in `lexicons/spacing/`; moves into `books/padding`
when scaffolded.)

## Grammar

Shorthand (1–4 values):

```
padding = <'padding-top'>{1,4}
<padding-top> = <length-percentage [0,∞]>
<length-percentage> = <length> | <percentage>
```

- 1 value: all four sides.
- 2 values: top/bottom | left/right.
- 3 values: top | left/right | bottom.
- 4 values: top | right | bottom | left (clockwise).

Longhands:

- **Physical:** `padding-top`, `padding-right`, `padding-bottom`, `padding-left`.
- **Logical** (css-logical): shorthands `padding-block` (block-start + end),
  `padding-inline` (inline-start + end); longhands `padding-block-start`,
  `padding-block-end`, `padding-inline-start`, `padding-inline-end`. There is no four-value
  logical shorthand; logical splits into the two axis shorthands.

## Value types

- `<length>` — a fixed length (`px`, `em`, `rem`, `ch`, `vw`, …).
- `<percentage>` — resolves against the **inline size (width in horizontal writing modes) of
  the containing block**, for all four sides (block-axis padding also uses the inline size).
- `<length-percentage>` — the combined type, range **`[0,∞]`** (non-negative).
- `0` — valid.

**Non-negative:** negative values are invalid for padding (grammar is `[0,∞]`).

## Keywords

- CSS-wide keywords: `inherit`, `initial`, `unset`, `revert`, `revert-layer`.
- No property-specific keywords (padding has no `auto`).

## Functional notations

- Math: `calc()`, `min()`, `max()`, `clamp()` resolving to a non-negative `<length-percentage>`.
- Substitution: `var()`, `env()`.
- `anchor-size()` is **not** accepted by padding (it is for margin / inset / sizing).

## Canonical facts (each longhand)

| initial | inherited | percentages | computed value | animation type |
| --- | --- | --- | --- | --- |
| `0` | no | width of the containing block | the percentage as specified, else the absolute length | by computed value, `<length>` |

**Applies to:** all elements except internal table boxes (`table-row-group`,
`table-header-group`, `table-footer-group`, `table-row`, `table-column-group`,
`table-column`); also `::first-letter` and `::first-line`.

## Notes

- The percentage basis is the containing block's **inline size even for the block-axis**
  (top/bottom) paddings — a common surprise.
- Percentage padding participates in layout sizing; that is layout behavior owned by the
  engine, not a value-validity concern.

## Sources

- W3C CSS Box Model Level 3 — padding: https://www.w3.org/TR/css-box-3/#paddings
- W3C CSS Logical Properties and Values Level 1: https://www.w3.org/TR/css-logical-1/
- MDN `padding`: https://developer.mozilla.org/en-US/docs/Web/CSS/padding
- MDN CSS logical properties: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values
