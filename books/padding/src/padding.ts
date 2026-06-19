import { nonNegative } from '@css-bookends/css-calipers';
import {
  mapSpacingMeasurements,
  parseSpacing,
  resolveSpacing,
} from '@css-bookends/spacing';

import type {
  NonNegativePaddingInput,
  PaddingInput,
  PaddingStore,
} from './types';

/**
 * INPUT step of the padding BOOK. Padding's domain is the spacing lexicon narrowed to
 * non-negative measurements + CSS-wide keywords (no `auto`, no `anchor-size()`). This
 * validates the shape and rejects `auto` / `anchor-size()` at runtime, then HARDENS each
 * measurement through the `nonNegative` refinement - which rejects negatives AND mints the
 * `NonNegativeMeasurement` brand, so the constraint shows up in the type (the governing
 * rule), not only at runtime. Spelling it out into the four-side store is the STORAGE step.
 */
export const parsePadding = (
  input: PaddingInput,
): NonNegativePaddingInput => {
  parseSpacing(input, { auto: false, anchorSize: false });
  return mapSpacingMeasurements(input, (measurement) =>
    nonNegative.ensure(measurement),
  );
};

/**
 * STORAGE step of the padding BOOK. Spells the hardened input (from `parsePadding`) out into
 * the canonical four-side `PaddingStore` via the shared lexicon `resolveSpacing` (scalar ->
 * all sides; `x`/`y` -> their axis; explicit side overrides axis; unset sides omitted). The
 * store carries `NonNegativeMeasurement`, so the non-negative constraint survives storage.
 */
export const storePadding = (
  input: NonNegativePaddingInput,
): PaddingStore => resolveSpacing(input);
