import {
  type Manuscript,
  publishBook,
} from '@css-bookends/bookpress';
import {
  anchorSize,
  defaultSpacingConfig,
  makeSpacingResult,
  parseSpacing,
  resolveSpacing,
} from '@css-bookends/spacing';

import type {
  MarginConfig,
  MarginInput,
  MarginResult,
  MarginStore,
} from './types';

/**
 * INPUT step of the margin BOOK. Margin's value domain is the spacing lexicon's permissive
 * default (auto + negatives + anchor-size all allowed), so this validates via the lexicon's
 * `parseSpacing` with the default policy and returns the input unchanged.
 */
export const parseMargin = (input: MarginInput): MarginInput =>
  parseSpacing(input);

/**
 * STORAGE step of the margin BOOK. Spells the (validated) input out into the canonical
 * four-side `MarginStore` via the shared lexicon `resolveSpacing` (scalar -> all sides;
 * `x`/`y` -> their axis; explicit side overrides axis; unset sides omitted). Assumes the
 * input was validated by `parseMargin` (parse-don't-validate).
 */
export const storeMargin = (input: MarginInput): MarginStore =>
  resolveSpacing(input);

/** The margin BOOK's output config defaults (longhand emission, as a style object). */
export const defaultMarginConfig: MarginConfig = defaultSpacingConfig;

/**
 * The margin BOOK's manuscript: INPUT validates + spells out to the four-side store, STORAGE
 * is the identity (already canonical), OUTPUT renders the `SpacingResult` keyed to `margin`.
 * A bare call (no input) yields an empty store -> empty result.
 */
export const marginManuscript: Manuscript<
  MarginInput,
  MarginStore,
  MarginResult,
  MarginConfig
> = {
  defaults: defaultMarginConfig,
  input: (raw) =>
    raw === undefined ? {} : storeMargin(parseMargin(raw)),
  storage: (store) => store,
  output: (store, cfg) => makeSpacingResult(store, cfg, 'margin'),
};

/**
 * The margin BOOK's factory: `publishBookMargin({ config })` binds a margin book. Calling the
 * book runs input -> storage -> output; `.store(raw)` returns the canonical store; `auto` and
 * `anchor-size()` are first-class (margin's permissive domain).
 */
export const publishBookMargin = publishBook(marginManuscript);

// Re-export the margin-only value builder so margin users have a single import.
export { anchorSize };
