# @css-bookends/typesetter

The CSS-Bookends **typesetter** (v0): the low-level mechanical converters that set
a single [DTCG](https://www.designtokens.org/tr/drafts/format/) token (Design
Tokens Format Module, 2025.10) into the most-constrained-yet-accurate
[css-calipers](https://www.npmjs.com/package/@css-bookends/css-calipers)
primitive.

It is the input-edge construct, opposite gilding (typesetter: DTCG tokens in;
gilding: finished CSS out). The typesetter keeps calipers itself DTCG-unaware:
calipers is the base layer, and this package depends on it.

## Scope (deliberately minimal)

This v0 is **only** the per-token converters. There is no document parser, no
`:root` generator, no config system, and no orchestration; that pipeline is TBD.
The public surface is one decision function plus its result and error types.

```ts
import { convertToken } from '@css-bookends/typesetter';

const r = convertToken({
  $type: 'dimension',
  $value: { value: 16, unit: 'px' },
});

if ('unsupported' in r) {
  // a deferred composite type (the TBD workflow); no calipers value
} else {
  r.value.css(); // -> "16px"
}
```

## The decision table

`convertToken(token)` takes any DTCG token with a resolved `$type` (this layer
does no tree-walking or `$type` inheritance) and decides which calipers primitive
to use plus what hardening to apply.

| DTCG `$type` | Converts to | Notes |
| --- | --- | --- |
| `dimension` `{ value, unit }` | `m(value, unit)` | units `px` / `rem` |
| `duration` `{ value, unit }` | `m(value, unit)` | a time measurement: `ms` / `s` |
| `number` | `i(n)` if integer, else `f(n)` | the most-constrained-accurate rule |
| `color` | `color(...)` | each DTCG colorSpace mapped accurately |
| `fontWeight` | constrained `[1, 1000]` integer, or a keyword passthrough | |

Every composite / remaining primitive (`fontFamily`, `cubicBezier`,
`strokeStyle`, `border`, `transition`, `shadow`, `gradient`, `typography`) is an
**explicit, documented deferral**: `convertToken` returns
`{ unsupported: true, type, reason }` rather than risk a silent wrong conversion.
A malformed **supported** token throws a typed `TypesetterError`.

Status: early (0.x). The converters and the deferral mechanism are in place; the
document parser and orchestration are not part of this package yet.
