import type {
  SelectorMap,
  StyleRule,
  StyleWithSelectors,
} from '../types';

export const mediaQueryOutputVanillaExtract = <
  TSelectorMap extends Record<string, unknown> = SelectorMap,
>(
  media: StyleRule,
): TSelectorMap =>
  ('@media' in (media as Record<string, unknown>)
    ? {
        '&': media,
      }
    : media) as unknown as TSelectorMap;

export const outputVanillaExtract = (media: StyleRule): SelectorMap =>
  mediaQueryOutputVanillaExtract<SelectorMap>(media);

export const preprocessorVanillaExtract = (
  media: StyleRule,
): SelectorMap => {
  const result: SelectorMap = {};
  const mediaQueries = media['@media'];

  if (!mediaQueries) {
    return {
      '&': media,
    };
  }

  const mergeRule = (
    base: StyleRule | undefined,
    next: StyleRule,
  ): StyleRule => {
    if (!base) return next;
    const merged: StyleRule = { ...base, ...next };
    const baseMedia = base['@media'];
    const nextMedia = next['@media'];
    if (baseMedia && nextMedia) {
      merged['@media'] = { ...baseMedia, ...nextMedia };
    }
    return merged;
  };

  const combineSelectors = (
    parent: string,
    child: string,
  ): string => {
    if (child.includes('&')) {
      return child.replace(/&/g, parent);
    }
    return `${parent} ${child}`.trim();
  };

  const collectSelectors = (
    rule: StyleWithSelectors,
    parentSelector: string,
    acc: Record<string, StyleRule>,
  ): void => {
    const { selectors, ...rest } = rule;
    const hasBase = Object.keys(rest).length > 0;

    if (hasBase) {
      acc[parentSelector] = mergeRule(acc[parentSelector], rest);
    }

    if (!selectors) return;

    Object.keys(selectors).forEach((selector) => {
      const selectorRule = selectors[selector];
      if (!selectorRule) return;
      const combined = combineSelectors(parentSelector, selector);
      collectSelectors(selectorRule, combined, acc);
    });
  };

  Object.keys(mediaQueries).forEach((query) => {
    const rule = mediaQueries[query] as
      | StyleWithSelectors
      | undefined;
    if (!rule) return;

    const perQuery: Record<string, StyleRule> = {};
    collectSelectors(rule, '&', perQuery);

    Object.keys(perQuery).forEach((selector) => {
      const selectorRule = perQuery[selector];
      if (!selectorRule || Object.keys(selectorRule).length === 0)
        return;

      const existing = result[selector] ?? { '@media': {} };
      const existingMedia =
        (existing['@media'] as Record<string, StyleRule>) ?? {};

      result[selector] = {
        ...existing,
        '@media': {
          ...existingMedia,
          [query]: selectorRule,
        },
      };
    });
  });

  return result;
};
