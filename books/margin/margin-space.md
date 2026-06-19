# margin value surface

The valid CSS value surface for the `margin` shorthand and its longhands, per the spec.
Implementation-agnostic; what the margin book actually covers is tracked in the book's
coverage doc and tests. (Draft lives here in `lexicons/spacing/`; moves into `books/margin`
when scaffolded.)

## Grammar

Shorthand (1–4 values; same side mapping as `padding`):

```
margin = <'margin-top'>{1,4}
<margin-top> = <length-percentage> | auto | <anchor-size()>
<length-percentage> = <length> | <percentage>
```

- 1 value: all four sides; 2: top/bottom | left/right; 3: top | left/right | bottom;
  4: top | right | bottom | left (clockwise).

Longhands:

- **Physical:** `margin-top`, `margin-right`, `margin-bottom`, `margin-left`.
- **Logical** (css-logical): shorthands `margin-block`, `margin-inline`; longhands
  `margin-block-start`, `margin-block-end`, `margin-inline-start`, `margin-inline-end`.

## Value types

- `<length>` — a fixed length; **negative values allowed** (pulls the element toward its
  neighbors).
- `<percentage>` — resolves against the **inline size (width) of the containing block**, for
  all four sides; negatives allowed.
- `<length-percentage>` — unrestricted range (no `[0,∞]` clamp, unlike padding).
- `0` — valid.

## Keywords

- `auto` — the UA selects a suitable margin, distributing available space (e.g.
  `margin: 0 auto` centers a block). Margin-only (not in padding).
- CSS-wide keywords: `inherit`, `initial`, `unset`, `revert`, `revert-layer`.

## Functional notations

- Math: `calc()`, `min()`, `max()`, `clamp()`; substitution: `var()`, `env()`.
- `anchor-size()` — accepted by margin (also inset / sizing; not padding). Grammar:

  ```
  anchor-size( [ <anchor-name> || <anchor-size> ]? , <length-percentage>? )
  <anchor-name> = <dashed-ident>
  <anchor-size> = width | height | block | inline | self-block | self-inline
  ```

  - `<anchor-name>` (e.g. `--my-anchor`) is optional; omitted = the element's default anchor.
  - `<anchor-size>` is optional; omitted = the keyword matching the property's own axis.
  - the trailing `<length-percentage>` is an optional fallback (used when the element is not
    anchor-positioned or the anchor is absent); if omitted when needed, the declaration is
    invalid.
  - examples: `margin: 5% anchor-size(width)`;
    `margin-left: calc(anchor-size(width) / 4)`;
    `anchor-size(--my-anchor self-inline, 50px)`.

## Canonical facts (each longhand)

| initial | inherited | percentages | computed value | animation type |
| --- | --- | --- | --- | --- |
| `0` | no | width of the containing block | the percentage as specified, else the absolute length | by computed value, `<length>` |

**Applies to:** all elements except boxes with a table display type other than
`table-caption`, `table`, and `inline-table`; also `::first-letter`.

## Notes

- Top and bottom margins have no effect on non-replaced inline elements (`<span>`, `<code>`).
- The percentage basis is the containing block's inline size even for block-axis margins.
- **Margin collapsing** (adjacent block-axis margins collapse to the larger of the two) is a
  layout behavior, not a value-validity matter — out of scope for the value surface.

## Sources

- W3C CSS Box Model Level 3 — margins: https://www.w3.org/TR/css-box-3/#margins
- W3C CSS Box Model Level 4: https://www.w3.org/TR/css-box-4/
- W3C CSS Logical Properties and Values Level 1: https://www.w3.org/TR/css-logical-1/
- W3C CSS Anchor Positioning Level 1 — `anchor-size()`: https://www.w3.org/TR/css-anchor-position-1/#anchor-size-fn
- MDN `margin`: https://developer.mozilla.org/en-US/docs/Web/CSS/margin
- MDN `anchor-size()`: https://developer.mozilla.org/en-US/docs/Web/CSS/anchor-size
