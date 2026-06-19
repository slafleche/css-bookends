import type {
  IMeasurement,
  NonNegativeMeasurement,
} from '@css-bookends/css-calipers';
import type {
  CssWideKeyword,
  Side,
  SpacingInput,
  SpacingStore,
} from '@css-bookends/spacing';

/**
 * The padding BOOK's input contract. Padding's value domain is the spacing lexicon narrowed
 * to its spec: any-unit measurements and the CSS-wide keywords only - NO `auto`, NO
 * `anchor-size()` (both excluded at the type level), and non-negative values (enforced by
 * the input step, which hardens each measurement to `NonNegativeMeasurement`). See
 * `padding-space.md` for the full CSS surface and the lexicon's `spacing-spec.md`.
 */
export type PaddingInput = SpacingInput<
  IMeasurement,
  CssWideKeyword,
  never
>;

/** The hardened result of `parsePadding`: every measurement is proven non-negative. */
export type NonNegativePaddingInput = SpacingInput<
  NonNegativeMeasurement,
  CssWideKeyword,
  never
>;

/**
 * The padding BOOK's canonical store: the hardened input spelled out per physical side
 * (partial - only the sides the input specified). Every value is a `NonNegativeMeasurement`,
 * so the non-negative constraint survives storage. Produced by `storePadding`.
 */
export type PaddingStore = SpacingStore<
  NonNegativeMeasurement,
  CssWideKeyword,
  never
>;

// Re-export the spacing value types padding consumers annotate with.
export type { CssWideKeyword, Side };
