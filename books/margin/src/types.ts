import type { IMeasurement } from '@css-bookends/css-calipers';
import type {
  AnchorSize,
  Axis,
  Side,
  SpacingConfig,
  SpacingInput,
  SpacingKeyword,
  SpacingResult,
  SpacingStore,
  SpacingStyle,
} from '@css-bookends/spacing';

/**
 * The margin BOOK's input contract. Margin's value domain is exactly the spacing lexicon's
 * permissive default: any-unit measurements, the CSS-wide keywords plus `auto`, negative
 * values, and `anchor-size()`. See `margin-space.md` for the full CSS surface and the
 * lexicon's `spacing-spec.md` for the shared contract.
 */
export type MarginInput = SpacingInput<
  IMeasurement,
  SpacingKeyword,
  AnchorSize
>;

/**
 * The margin BOOK's canonical store: `MarginInput` spelled out per physical side (partial -
 * only the sides the input specified). Produced by `storeMargin`.
 */
export type MarginStore = SpacingStore<
  IMeasurement,
  SpacingKeyword,
  AnchorSize
>;

/** The margin BOOK's output config (the shared `SpacingConfig`: `emit` + `format`). */
export type MarginConfig = SpacingConfig;

/** The margin BOOK's output object - a `SpacingResult` keyed to the `margin` property. */
export type MarginResult = SpacingResult<'margin'>;

/** The plain style object margin emits: `marginTop` ... `marginLeft` + the `margin` shorthand. */
export type MarginStyle = SpacingStyle<'margin'>;

// Re-export the spacing value + output types margin consumers annotate with.
export type {
  AnchorSize,
  Axis,
  Side,
  SpacingConfig,
  SpacingKeyword,
  SpacingResult,
};
