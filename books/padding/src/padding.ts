import {
  type Manuscript,
  publishBook,
} from '@css-bookends/bookpress';
import { nonNegative } from '@css-bookends/css-calipers';
import {
  defaultSpacingConfig,
  makeSpacingResult,
  mapSpacingMeasurements,
  parseSpacing,
  resolveSpacing,
} from '@css-bookends/spacing';

import type {
  NonNegativePaddingInput,
  PaddingConfig,
  PaddingInput,
  PaddingResult,
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

/** The padding BOOK's output config defaults (longhand emission, as a style object). */
export const defaultPaddingConfig: PaddingConfig =
  defaultSpacingConfig;

/**
 * The padding BOOK's manuscript: INPUT validates + HARDENS (negatives, `auto`, and
 * `anchor-size()` all throw) and spells out to the four-side store, STORAGE is the identity,
 * OUTPUT renders the `SpacingResult` keyed to `padding`. The input gate is inherited through
 * the factory, so `publishBookPadding()(m(-4))` throws. A bare call yields an empty result.
 */
export const paddingManuscript: Manuscript<
  PaddingInput,
  PaddingStore,
  PaddingResult,
  PaddingConfig
> = {
  defaults: defaultPaddingConfig,
  input: (raw) =>
    raw === undefined ? {} : storePadding(parsePadding(raw)),
  storage: (store) => store,
  output: (store, cfg) => makeSpacingResult(store, cfg, 'padding'),
};

/**
 * The padding BOOK's factory: `publishBookPadding({ config })` binds a padding book. Calling
 * the book runs input -> storage -> output; `.store(raw)` returns the canonical store. The
 * non-negative + no-`auto` / no-`anchor-size()` gates fire on the input step, through the factory.
 */
export const publishBookPadding = publishBook(paddingManuscript);
