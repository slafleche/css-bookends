import { anchorSize, parseSpacing } from '@css-bookends/spacing';

import type { MarginInput } from './types';

/**
 * INPUT step of the margin BOOK. Margin's value domain is the spacing lexicon's permissive
 * default (auto + negatives + anchor-size all allowed), so this validates via the lexicon's
 * `parseSpacing` with the default policy and returns the input unchanged. Spelling it out
 * into the canonical four-side store is the STORAGE step (a later phase).
 */
export const parseMargin = (input: MarginInput): MarginInput =>
  parseSpacing(input);

// Re-export the margin-only value builder so margin users have a single import.
export { anchorSize };
