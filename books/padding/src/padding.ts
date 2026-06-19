import { nonNegative } from '@css-bookends/css-calipers';
import {
  mapSpacingMeasurements,
  parseSpacing,
} from '@css-bookends/spacing';

import type { NonNegativePaddingInput, PaddingInput } from './types';

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
