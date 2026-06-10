// Compiler-agnostic. This produces plain `@supports` style data; the consumer
// applies it with whatever tool they use (vanilla-extract `globalStyle`, plain
// CSS-in-JS, a build step, etc.). Nothing here imports a CSS compiler.

export type SupportsFallbackConfig<Style> = {
  selector: string | string[];
  supported: Style;
  fallback: Style;
};

export type SupportsFallbackRule<Style> = {
  selector: string;
  style: { '@supports': Record<string, Style> };
};

const wrapQuery = (query: string): string => {
  const trimmed = query.trim();
  if (!trimmed.length) {
    throw new Error('createSupportsFallback requires a non-empty query.');
  }
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    return trimmed;
  }
  return `(${trimmed})`;
};

/**
 * Build an `@supports` fallback applier for a feature query.
 *
 * Returns a function that, given a selector (or selectors) plus `supported` /
 * `fallback` style objects, returns one `{ selector, style }` rule per selector.
 * The `style` is `{ '@supports': { '(query)': supported, 'not (query)': fallback } }`.
 * Feed the result into your styling tool, e.g. with vanilla-extract:
 *
 *   createSupportsFallback('display: grid')({ selector, supported, fallback })
 *     .forEach(({ selector, style }) => globalStyle(selector, style));
 */
export const createSupportsFallback = (query: string) => {
  const normalized = wrapQuery(query);
  const negated = `not ${normalized}`;

  return <Style>({
    selector,
    supported,
    fallback,
  }: SupportsFallbackConfig<Style>): SupportsFallbackRule<Style>[] => {
    const selectors = Array.isArray(selector) ? selector : [selector];
    return selectors.map((target) => ({
      selector: target,
      style: {
        '@supports': {
          [normalized]: supported,
          [negated]: fallback,
        },
      },
    }));
  };
};
