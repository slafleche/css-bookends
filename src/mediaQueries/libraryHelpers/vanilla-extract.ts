import type { ComplexStyleRule } from '../types';

export const mediaQueryOutputVanillaExtract = (
  media: ComplexStyleRule,
): Record<string, unknown> => ({
  '&': media,
});
