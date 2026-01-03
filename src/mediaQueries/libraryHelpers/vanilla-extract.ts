import type { SelectorMap, StyleRule } from '../types';

export const mediaQueryOutputVanillaExtract = (
  media: StyleRule,
): SelectorMap => ({
  '&': media,
});
