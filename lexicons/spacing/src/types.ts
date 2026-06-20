import type { IMeasurement } from '@css-bookends/css-calipers';
import type { Property } from 'csstype';

/**
 * The spacing LEXICON's shared contract. spacing is shared guts (never used alone); the
 * padding and margin BOOKS compose it: `parseSpacing` (validate, with each book's policy)
 * for INPUT, then `resolveSpacing` (spell the shorthand out into the canonical four-side
 * `SpacingStore`) for STORAGE.
 *
 * Value types are generic over the measurement type `M` (padding narrows it to
 * `NonNegativeMeasurement`), the allowed keyword set `K`, and any extra value kinds `F`
 * (e.g. `anchor-size()`, margin-only), so each book narrows the lexicon to its spec at the
 * type level (the runtime `SpacingPolicy` mirrors the value-domain split).
 */

/** CSS-wide keywords, valid on any property (and on both padding + margin). */
export type CssWideKeyword =
  | 'inherit'
  | 'initial'
  | 'unset'
  | 'revert'
  | 'revert-layer';

/** Full keyword set: the CSS-wide keywords plus `auto` (margin only, not padding). */
export type SpacingKeyword = CssWideKeyword | 'auto';

/** The axis keyword of `anchor-size()`. */
export type AnchorSizeKeyword =
  | 'width'
  | 'height'
  | 'block'
  | 'inline'
  | 'self-block'
  | 'self-inline';

/**
 * A modeled `anchor-size()` value (CSS Anchor Positioning). Valid on margin (and
 * inset/sizing) but NOT padding. Grammar:
 *   anchor-size( [ <dashed-ident> || <anchor-size> ]? , <length-percentage>? )
 */
export interface AnchorSize {
  readonly kind: 'anchorSize';
  /** the anchor's `<dashed-ident>` name (e.g. `--my-anchor`); omitted = default anchor. */
  readonly anchor?: string;
  /** which size to read; omitted = the property's own axis. */
  readonly size?: AnchorSizeKeyword;
  /** fallback used when not anchor-positioned / the anchor is absent. */
  readonly fallback?: IMeasurement;
}

/** Options for the `anchorSize()` builder. */
export type AnchorSizeOptions = Omit<AnchorSize, 'kind'>;

/**
 * A single spacing value.
 * - `M` = the measurement type (padding narrows it to `NonNegativeMeasurement`).
 * - `K` = the allowed keyword set (padding drops `auto`).
 * - `F` = extra value kinds (margin adds `AnchorSize`; padding sets `never`).
 */
export type SpacingValue<
  M extends IMeasurement = IMeasurement,
  K extends SpacingKeyword = SpacingKeyword,
  F extends AnchorSize = AnchorSize,
> = M | K | 0 | F;

/** The physical sides. */
export type Side = 'top' | 'right' | 'bottom' | 'left';

/** The axes: `x` = left + right, `y` = top + bottom. */
export type Axis = 'x' | 'y';

/**
 * Object form: per-axis (`x`/`y`) and/or per-side values. An explicit side overrides
 * its axis. No `all` key - a bare scalar is the all-sides shorthand.
 */
export type SpacingObject<
  M extends IMeasurement = IMeasurement,
  K extends SpacingKeyword = SpacingKeyword,
  F extends AnchorSize = AnchorSize,
> = Partial<Record<Axis | Side, SpacingValue<M, K, F>>>;

/**
 * What the lexicon accepts: a scalar (shorthand) or the object form. `parseSpacing` returns
 * it unchanged (validated, shorthand intact); `resolveSpacing` spells it out into the
 * canonical four-side `SpacingStore`.
 */
export type SpacingInput<
  M extends IMeasurement = IMeasurement,
  K extends SpacingKeyword = SpacingKeyword,
  F extends AnchorSize = AnchorSize,
> = SpacingValue<M, K, F> | SpacingObject<M, K, F>;

/**
 * A canonical store SLOT: one side's value, tagged by `kind` (modeled on the colour book's
 * `Store` discriminated union). The special words (`auto`, the CSS-wide keywords) are tagged
 * `symbolic` and emitted verbatim, distinct from a real `length`; `anchor-size()` already
 * carries its own `kind: 'anchorSize'`, so it is a slot as-is. A book narrows the slot at the
 * type level: padding sets `K = CssWideKeyword` (so a padding slot can NEVER be `symbolic`
 * `auto`), `F = never` (no anchor-size), `M = NonNegativeMeasurement`.
 */
export type SpacingSlot<
  M extends IMeasurement = IMeasurement,
  K extends SpacingKeyword = SpacingKeyword,
  F extends AnchorSize = AnchorSize,
> =
  | { readonly kind: 'length'; readonly value: M | 0 }
  | { readonly kind: 'symbolic'; readonly keyword: K }
  | F;

/**
 * The canonical store: the input spelled out per physical side as tagged {@link SpacingSlot}s.
 * **Partial** - only the sides the input specified are present (a scalar fills all four;
 * `{ x }` fills left + right only), so a book can emit just those sides (longhands) and let a
 * hand-written `calc()`/`var()` side sit next to them. Produced by `resolveSpacing`.
 */
export type SpacingStore<
  M extends IMeasurement = IMeasurement,
  K extends SpacingKeyword = SpacingKeyword,
  F extends AnchorSize = AnchorSize,
> = Partial<Record<Side, SpacingSlot<M, K, F>>>;

/** The two properties a spacing book can emit. */
export type SpacingProperty = 'margin' | 'padding';

/**
 * csstype's value type for the property. Margin includes `auto`; padding does not - though
 * note csstype's `(string & {})` escape hatch means this type does not, on its own, REJECT
 * `auto` for padding. The hard auto-split is enforced at the store ({@link SpacingSlot}'s
 * `K`) and at input (padding throws on `auto`); this type drives the keys + good DX.
 */
type SpacingPropertyValue<P extends SpacingProperty> =
  P extends 'margin' ? Property.Margin : Property.Padding;

/**
 * The plain CSS style object a spacing book emits: per-side longhand keys
 * `${P}${Capitalize<Side>}` (e.g. `marginTop`, `paddingLeft`) plus the shorthand key `P`
 * (`margin` / `padding`). All optional - the chosen `emit` decides which are present, and a
 * partial store emits only its sides. Every value is the matching csstype `Property` type.
 */
export type SpacingStyle<P extends SpacingProperty> = {
  [S in Side as `${P}${Capitalize<S>}`]?: SpacingPropertyValue<P>;
} & { [Shorthand in P]?: SpacingPropertyValue<P> };

/**
 * The output config (factory-settable via `publishBook*`). `emit` picks per-side longhands or
 * the collapsed 1-4 value shorthand; `format` picks a spreadable style object or a CSS
 * declaration string.
 */
export interface SpacingConfig {
  emit: 'longhand' | 'shorthand';
  format: 'object' | 'string';
}

/**
 * A side (`top`/.../`left`) or axis (`x`/`y`) accessor on a {@link SpacingResult}. Calling it
 * (`()`) returns the declaration in the configured `format`; `.css()` returns the bare value
 * (no property name). Both are `undefined` when the side/axis is absent (and `.css()` on an
 * axis is `undefined` unless its two sides are present AND equal).
 */
export interface SideAccessor<P extends SpacingProperty> {
  (): SpacingStyle<P> | string | undefined;
  css(): string | undefined;
}

/**
 * The book's output object. `.css()` renders the configured `emit x format`; `.longhand()` /
 * `.shorthand()` force a form (`.shorthand()` THROWS on a partial store). The `top`/`right`/
 * `bottom`/`left` and `x`/`y` accessors expose individual sides/axes.
 *
 * `.css()` is `SpacingStyle<P> | string` (a union, not format-precise) because `format` is a
 * runtime config value that the bookpress engine does not thread into this output type;
 * callers narrow.
 */
export interface SpacingResult<P extends SpacingProperty> {
  css(): SpacingStyle<P> | string;
  longhand(): SpacingStyle<P> | string;
  shorthand(): SpacingStyle<P> | string;
  top: SideAccessor<P>;
  right: SideAccessor<P>;
  bottom: SideAccessor<P>;
  left: SideAccessor<P>;
  x: SideAccessor<P>;
  y: SideAccessor<P>;
}

/**
 * The value-domain policy a consuming book applies (the padding/margin spec split).
 * Each flag defaults to allowed; a book sets `false` to forbid (-> violation).
 */
export interface SpacingPolicy {
  /** allow the `auto` keyword (margin: true; padding: false). */
  auto?: boolean;
  /** allow negative measurements (margin: true; padding: false). */
  negative?: boolean;
  /** allow `anchor-size()` (margin: true; padding: false). */
  anchorSize?: boolean;
}
