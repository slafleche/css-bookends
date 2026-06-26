/**
 * `@css-bookends/gilding` - the CSS-Bookends finisher.
 *
 * The output-edge build-time construct: a thin onion around a CSS post-processor
 * (default core: Lightning CSS) that completes browser compatibility (older-browser
 * color fallbacks and vendor prefixes) over the plain CSS that books emit. Sibling to
 * the typesetter, not a book.
 *
 * The config splits into an evergreen surface (`targets`) and an impl-specific
 * pass-through, so the wrapped `core` can be swapped without changing the surface.
 */
export {
  composeCore,
  composeCoreFromFormats,
  type FallbackBearingFormat,
  type FormatRegistry,
  keywordToRgb,
  type PreStep,
} from './cores/compose';
export {
  lightningCore,
  type LightningOptions,
} from './cores/lightningcss';
export { createGilding } from './finisher';
export type {
  EvergreenConfig,
  FinishConfig,
  PostProcessCore,
} from './types';
