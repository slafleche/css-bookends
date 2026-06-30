// The whole compendium, behind ONE factory. `publishCompendium` is the path: there is
// no pre-built instance, you call the factory and get EVERY active book bound + the
// lexicons (css-calipers) in one object. The bare call `publishCompendium()` is the
// "lazy import-all" form: every book is bound at its own defaults. Passing a
// `CompendiumConfig` configures any subset (one optional key per book). The DEFAULT
// export IS the factory itself, so `import publishCompendium from '@css-bookends/compendium'`
// and the named `{ publishCompendium }` are the same function.
//
//   const c = publishCompendium({ color: { output: colorFormats.rgba } });
//   c.color('#3366cc').darken(0.2).css();
//   c.m(8).css();
//   c.opacity(0.5).css();
//
// NOTE on composed books: borders / margin / padding follow the per-property factory
// pattern (publishBook<Name> + <Name>Config) and are config-keyed below like every other
// factory book. The remaining composed books (backdrop-filter, transforms, shadows,
// positioning, supports-fallback) DO NOT expose a publishBook<Name> factory or a
// threadable per-book config: they are utility namespaces. They are still bound here (so
// every active book is present on the returned object), but under their whole namespace
// and WITHOUT a key in CompendiumConfig, because there is no factory config to forward.
// ---- factory books: publishBook<Name> + <Name>Config ----
import {
  type AnimationIterationCountConfig,
  publishBookAnimationIterationCount,
} from '@css-bookends/animation-iteration-count';
// ---- composed books: utility namespaces, no factory / no per-book config ----
import * as backdropFilter from '@css-bookends/backdrop-filter';
import {
  type BorderImageOutsetConfig,
  publishBookBorderImageOutset,
} from '@css-bookends/border-image-outset';
import {
  type BorderImageSliceConfig,
  publishBookBorderImageSlice,
} from '@css-bookends/border-image-slice';
import {
  type BorderImageWidthConfig,
  publishBookBorderImageWidth,
} from '@css-bookends/border-image-width';
import {
  type BordersConfig,
  publishBookBorders,
} from '@css-bookends/borders';
import {
  type ColorConfig,
  publishBookColor,
} from '@css-bookends/color';
import {
  type ColumnCountConfig,
  publishBookColumnCount,
} from '@css-bookends/column-count';
import {
  type CounterIncrementConfig,
  publishBookCounterIncrement,
} from '@css-bookends/counter-increment';
import {
  type CounterResetConfig,
  publishBookCounterReset,
} from '@css-bookends/counter-reset';
import {
  type CounterSetConfig,
  publishBookCounterSet,
} from '@css-bookends/counter-set';
import {
  type CalipersBundleConfig,
  createCalipersBundle,
  type Hardening,
} from '@css-bookends/css-calipers';
import * as calipers from '@css-bookends/css-calipers';
import {
  type FillOpacityConfig,
  publishBookFillOpacity,
} from '@css-bookends/fill-opacity';
import {
  type FlexGrowConfig,
  publishBookFlexGrow,
} from '@css-bookends/flex-grow';
import {
  type FlexShrinkConfig,
  publishBookFlexShrink,
} from '@css-bookends/flex-shrink';
import {
  type FloodOpacityConfig,
  publishBookFloodOpacity,
} from '@css-bookends/flood-opacity';
import {
  type FontSizeAdjustConfig,
  publishBookFontSizeAdjust,
} from '@css-bookends/font-size-adjust';
import {
  type FontWeightConfig,
  publishBookFontWeight,
} from '@css-bookends/font-weight';
import {
  type GridColumnEndConfig,
  publishBookGridColumnEnd,
} from '@css-bookends/grid-column-end';
import {
  type GridColumnStartConfig,
  publishBookGridColumnStart,
} from '@css-bookends/grid-column-start';
import {
  type GridRowEndConfig,
  publishBookGridRowEnd,
} from '@css-bookends/grid-row-end';
import {
  type GridRowStartConfig,
  publishBookGridRowStart,
} from '@css-bookends/grid-row-start';
import {
  type LineClampConfig,
  publishBookLineClamp,
} from '@css-bookends/line-clamp';
import {
  type LineHeightConfig,
  publishBookLineHeight,
} from '@css-bookends/line-height';
import {
  type MarginConfig,
  publishBookMargin,
} from '@css-bookends/margin';
import {
  type MaskBorderOutsetConfig,
  publishBookMaskBorderOutset,
} from '@css-bookends/mask-border-outset';
import {
  type MaskBorderSliceConfig,
  publishBookMaskBorderSlice,
} from '@css-bookends/mask-border-slice';
import {
  type MaskBorderWidthConfig,
  publishBookMaskBorderWidth,
} from '@css-bookends/mask-border-width';
import {
  type MathDepthConfig,
  publishBookMathDepth,
} from '@css-bookends/math-depth';
import {
  type OpacityConfig,
  publishBookOpacity,
} from '@css-bookends/opacity';
import {
  type OrderConfig,
  publishBookOrder,
} from '@css-bookends/order';
import {
  type OrphansConfig,
  publishBookOrphans,
} from '@css-bookends/orphans';
import {
  type PaddingConfig,
  publishBookPadding,
} from '@css-bookends/padding';
import * as positioning from '@css-bookends/positioning';
import {
  publishBookScale,
  type ScaleConfig,
} from '@css-bookends/scale';
import * as shadows from '@css-bookends/shadows';
import {
  publishBookShapeImageThreshold,
  type ShapeImageThresholdConfig,
} from '@css-bookends/shape-image-threshold';
import {
  publishBookStopOpacity,
  type StopOpacityConfig,
} from '@css-bookends/stop-opacity';
import {
  publishBookStrokeDasharray,
  type StrokeDasharrayConfig,
} from '@css-bookends/stroke-dasharray';
import {
  publishBookStrokeDashoffset,
  type StrokeDashoffsetConfig,
} from '@css-bookends/stroke-dashoffset';
import {
  publishBookStrokeMiterlimit,
  type StrokeMiterlimitConfig,
} from '@css-bookends/stroke-miterlimit';
import {
  publishBookStrokeOpacity,
  type StrokeOpacityConfig,
} from '@css-bookends/stroke-opacity';
import {
  publishBookStrokeWidth,
  type StrokeWidthConfig,
} from '@css-bookends/stroke-width';
import * as supportsFallback from '@css-bookends/supports-fallback';
import {
  publishBookTabSize,
  type TabSizeConfig,
} from '@css-bookends/tab-size';
import * as transforms from '@css-bookends/transforms';
import {
  publishBookWidows,
  type WidowsConfig,
} from '@css-bookends/widows';
import {
  publishBookZIndex,
  type ZIndexConfig,
} from '@css-bookends/z-index';
import { publishBookZoom, type ZoomConfig } from '@css-bookends/zoom';

/**
 * The master config. One OPTIONAL key per FACTORY book, keyed to that book's config
 * type. `color` takes `Partial<ColorConfig>` (as the shelf does); every per-property
 * book takes its own `<Name>Config`. The composed books (backdropFilter, positioning,
 * shadows, supportsFallback, transforms) have NO key here: they expose no factory
 * config to forward, so there is nothing to tune. A bare `publishCompendium()` binds
 * every book at its defaults; supply any subset of these keys to configure.
 */
export interface CompendiumConfig {
  /**
   * Shared options that cascade to every unit (books AND, through the nested
   * corpus, the calipers primitives). A unit's own key wins, then this global,
   * then the factory default.
   */
  global?: {
    /** Hardening reaction, forwarded into the calipers primitives. */
    hardening?: Hardening;
  };
  /**
   * The whole calipers (corpus) config, forwarded to `createCalipersBundle`.
   * A primitive resolves own (`calipers.<unit>`) -> `calipers.global`
   * (corpus global) -> `compendium.global` -> factory default.
   */
  calipers?: CalipersBundleConfig;
  color?: Partial<ColorConfig>;
  animationIterationCount?: AnimationIterationCountConfig;
  borderImageOutset?: BorderImageOutsetConfig; // empty config (Record<string, never>)
  borderImageSlice?: BorderImageSliceConfig; // empty config (Record<string, never>)
  borderImageWidth?: BorderImageWidthConfig; // empty config (Record<string, never>)
  borders?: BordersConfig;
  columnCount?: ColumnCountConfig;
  counterIncrement?: CounterIncrementConfig; // empty config (Record<string, never>)
  counterReset?: CounterResetConfig; // empty config (Record<string, never>)
  counterSet?: CounterSetConfig; // empty config (Record<string, never>)
  fillOpacity?: FillOpacityConfig;
  flexGrow?: FlexGrowConfig;
  flexShrink?: FlexShrinkConfig;
  floodOpacity?: FloodOpacityConfig;
  fontSizeAdjust?: FontSizeAdjustConfig;
  fontWeight?: FontWeightConfig;
  gridColumnEnd?: GridColumnEndConfig; // empty config (Record<string, never>)
  gridColumnStart?: GridColumnStartConfig; // empty config (Record<string, never>)
  gridRowEnd?: GridRowEndConfig; // empty config (Record<string, never>)
  gridRowStart?: GridRowStartConfig; // empty config (Record<string, never>)
  lineClamp?: LineClampConfig;
  lineHeight?: LineHeightConfig;
  margin?: MarginConfig;
  maskBorderOutset?: MaskBorderOutsetConfig; // empty config (Record<string, never>)
  maskBorderSlice?: MaskBorderSliceConfig; // empty config (Record<string, never>)
  maskBorderWidth?: MaskBorderWidthConfig; // empty config (Record<string, never>)
  mathDepth?: MathDepthConfig;
  opacity?: OpacityConfig;
  order?: OrderConfig;
  orphans?: OrphansConfig;
  padding?: PaddingConfig;
  scale?: ScaleConfig;
  shapeImageThreshold?: ShapeImageThresholdConfig;
  stopOpacity?: StopOpacityConfig;
  strokeDasharray?: StrokeDasharrayConfig; // empty config (Record<string, never>)
  strokeDashoffset?: StrokeDashoffsetConfig; // empty config (Record<string, never>)
  strokeMiterlimit?: StrokeMiterlimitConfig;
  strokeOpacity?: StrokeOpacityConfig;
  strokeWidth?: StrokeWidthConfig; // empty config (Record<string, never>)
  tabSize?: TabSizeConfig;
  widows?: WidowsConfig;
  zIndex?: ZIndexConfig;
  zoom?: ZoomConfig;
}

/**
 * The bound compendium: every book under its name + the lexicons spread by name.
 * `color` is the bound color BOOK (the factory result), so it shadows the calipers
 * `color` value primitive of the same name (excluded from the spread surface here).
 * The composed books are bound under their whole namespace.
 */
export type Compendium = Omit<typeof calipers, 'color'> & {
  color: ReturnType<typeof publishBookColor>;
  animationIterationCount: ReturnType<
    typeof publishBookAnimationIterationCount
  >;
  borderImageOutset: ReturnType<typeof publishBookBorderImageOutset>;
  borderImageSlice: ReturnType<typeof publishBookBorderImageSlice>;
  borderImageWidth: ReturnType<typeof publishBookBorderImageWidth>;
  borders: ReturnType<typeof publishBookBorders>;
  columnCount: ReturnType<typeof publishBookColumnCount>;
  counterIncrement: ReturnType<typeof publishBookCounterIncrement>;
  counterReset: ReturnType<typeof publishBookCounterReset>;
  counterSet: ReturnType<typeof publishBookCounterSet>;
  fillOpacity: ReturnType<typeof publishBookFillOpacity>;
  flexGrow: ReturnType<typeof publishBookFlexGrow>;
  flexShrink: ReturnType<typeof publishBookFlexShrink>;
  floodOpacity: ReturnType<typeof publishBookFloodOpacity>;
  fontSizeAdjust: ReturnType<typeof publishBookFontSizeAdjust>;
  fontWeight: ReturnType<typeof publishBookFontWeight>;
  gridColumnEnd: ReturnType<typeof publishBookGridColumnEnd>;
  gridColumnStart: ReturnType<typeof publishBookGridColumnStart>;
  gridRowEnd: ReturnType<typeof publishBookGridRowEnd>;
  gridRowStart: ReturnType<typeof publishBookGridRowStart>;
  lineClamp: ReturnType<typeof publishBookLineClamp>;
  lineHeight: ReturnType<typeof publishBookLineHeight>;
  margin: ReturnType<typeof publishBookMargin>;
  maskBorderOutset: ReturnType<typeof publishBookMaskBorderOutset>;
  maskBorderSlice: ReturnType<typeof publishBookMaskBorderSlice>;
  maskBorderWidth: ReturnType<typeof publishBookMaskBorderWidth>;
  mathDepth: ReturnType<typeof publishBookMathDepth>;
  opacity: ReturnType<typeof publishBookOpacity>;
  order: ReturnType<typeof publishBookOrder>;
  orphans: ReturnType<typeof publishBookOrphans>;
  padding: ReturnType<typeof publishBookPadding>;
  scale: ReturnType<typeof publishBookScale>;
  shapeImageThreshold: ReturnType<
    typeof publishBookShapeImageThreshold
  >;
  stopOpacity: ReturnType<typeof publishBookStopOpacity>;
  strokeDasharray: ReturnType<typeof publishBookStrokeDasharray>;
  strokeDashoffset: ReturnType<typeof publishBookStrokeDashoffset>;
  strokeMiterlimit: ReturnType<typeof publishBookStrokeMiterlimit>;
  strokeOpacity: ReturnType<typeof publishBookStrokeOpacity>;
  strokeWidth: ReturnType<typeof publishBookStrokeWidth>;
  tabSize: ReturnType<typeof publishBookTabSize>;
  widows: ReturnType<typeof publishBookWidows>;
  zIndex: ReturnType<typeof publishBookZIndex>;
  zoom: ReturnType<typeof publishBookZoom>;
  backdropFilter: typeof backdropFilter;
  positioning: typeof positioning;
  shadows: typeof shadows;
  supportsFallback: typeof supportsFallback;
  transforms: typeof transforms;
};

/**
 * Bind the whole compendium: each factory book via its own factory (under its name),
 * each composed book under its namespace, with the lexicons (`css-calipers`) spread
 * straight up by their names. The color book is assigned LAST so it wins the `color`
 * slot over the calipers value fn.
 */
export const publishCompendium = (
  config: CompendiumConfig = {},
): Compendium => ({
  ...calipers,
  // Spread the CONFIGURED calipers bundle over the raw namespace so the cascade
  // reaches the primitives (own calipers.<unit> -> corpus.global ->
  // compendium.global -> default), overriding the default m / i / f. The raw
  // `...calipers` above still provides the broader namespace (r, helpers, types).
  ...createCalipersBundle({
    ...config.calipers,
    global: {
      ...config.calipers?.global,
      hardening:
        config.calipers?.global?.hardening ??
        config.global?.hardening,
    },
  }),
  animationIterationCount: publishBookAnimationIterationCount(
    config.animationIterationCount !== undefined
      ? { config: config.animationIterationCount }
      : undefined,
  ),
  borderImageOutset: publishBookBorderImageOutset(
    config.borderImageOutset !== undefined
      ? { config: config.borderImageOutset }
      : undefined,
  ),
  borderImageSlice: publishBookBorderImageSlice(
    config.borderImageSlice !== undefined
      ? { config: config.borderImageSlice }
      : undefined,
  ),
  borderImageWidth: publishBookBorderImageWidth(
    config.borderImageWidth !== undefined
      ? { config: config.borderImageWidth }
      : undefined,
  ),
  borders: publishBookBorders(
    config.borders !== undefined
      ? { config: config.borders }
      : undefined,
  ),
  columnCount: publishBookColumnCount(
    config.columnCount !== undefined
      ? { config: config.columnCount }
      : undefined,
  ),
  counterIncrement: publishBookCounterIncrement(
    config.counterIncrement !== undefined
      ? { config: config.counterIncrement }
      : undefined,
  ),
  counterReset: publishBookCounterReset(
    config.counterReset !== undefined
      ? { config: config.counterReset }
      : undefined,
  ),
  counterSet: publishBookCounterSet(
    config.counterSet !== undefined
      ? { config: config.counterSet }
      : undefined,
  ),
  fillOpacity: publishBookFillOpacity(
    config.fillOpacity !== undefined
      ? { config: config.fillOpacity }
      : undefined,
  ),
  flexGrow: publishBookFlexGrow(
    config.flexGrow !== undefined
      ? { config: config.flexGrow }
      : undefined,
  ),
  flexShrink: publishBookFlexShrink(
    config.flexShrink !== undefined
      ? { config: config.flexShrink }
      : undefined,
  ),
  floodOpacity: publishBookFloodOpacity(
    config.floodOpacity !== undefined
      ? { config: config.floodOpacity }
      : undefined,
  ),
  fontSizeAdjust: publishBookFontSizeAdjust(
    config.fontSizeAdjust !== undefined
      ? { config: config.fontSizeAdjust }
      : undefined,
  ),
  fontWeight: publishBookFontWeight(
    config.fontWeight !== undefined
      ? { config: config.fontWeight }
      : undefined,
  ),
  gridColumnEnd: publishBookGridColumnEnd(
    config.gridColumnEnd !== undefined
      ? { config: config.gridColumnEnd }
      : undefined,
  ),
  gridColumnStart: publishBookGridColumnStart(
    config.gridColumnStart !== undefined
      ? { config: config.gridColumnStart }
      : undefined,
  ),
  gridRowEnd: publishBookGridRowEnd(
    config.gridRowEnd !== undefined
      ? { config: config.gridRowEnd }
      : undefined,
  ),
  gridRowStart: publishBookGridRowStart(
    config.gridRowStart !== undefined
      ? { config: config.gridRowStart }
      : undefined,
  ),
  lineClamp: publishBookLineClamp(
    config.lineClamp !== undefined
      ? { config: config.lineClamp }
      : undefined,
  ),
  lineHeight: publishBookLineHeight(
    config.lineHeight !== undefined
      ? { config: config.lineHeight }
      : undefined,
  ),
  margin: publishBookMargin(
    config.margin !== undefined
      ? { config: config.margin }
      : undefined,
  ),
  maskBorderOutset: publishBookMaskBorderOutset(
    config.maskBorderOutset !== undefined
      ? { config: config.maskBorderOutset }
      : undefined,
  ),
  maskBorderSlice: publishBookMaskBorderSlice(
    config.maskBorderSlice !== undefined
      ? { config: config.maskBorderSlice }
      : undefined,
  ),
  maskBorderWidth: publishBookMaskBorderWidth(
    config.maskBorderWidth !== undefined
      ? { config: config.maskBorderWidth }
      : undefined,
  ),
  mathDepth: publishBookMathDepth(
    config.mathDepth !== undefined
      ? { config: config.mathDepth }
      : undefined,
  ),
  opacity: publishBookOpacity(
    config.opacity !== undefined
      ? { config: config.opacity }
      : undefined,
  ),
  order: publishBookOrder(
    config.order !== undefined ? { config: config.order } : undefined,
  ),
  orphans: publishBookOrphans(
    config.orphans !== undefined
      ? { config: config.orphans }
      : undefined,
  ),
  padding: publishBookPadding(
    config.padding !== undefined
      ? { config: config.padding }
      : undefined,
  ),
  scale: publishBookScale(
    config.scale !== undefined ? { config: config.scale } : undefined,
  ),
  shapeImageThreshold: publishBookShapeImageThreshold(
    config.shapeImageThreshold !== undefined
      ? { config: config.shapeImageThreshold }
      : undefined,
  ),
  stopOpacity: publishBookStopOpacity(
    config.stopOpacity !== undefined
      ? { config: config.stopOpacity }
      : undefined,
  ),
  strokeDasharray: publishBookStrokeDasharray(
    config.strokeDasharray !== undefined
      ? { config: config.strokeDasharray }
      : undefined,
  ),
  strokeDashoffset: publishBookStrokeDashoffset(
    config.strokeDashoffset !== undefined
      ? { config: config.strokeDashoffset }
      : undefined,
  ),
  strokeMiterlimit: publishBookStrokeMiterlimit(
    config.strokeMiterlimit !== undefined
      ? { config: config.strokeMiterlimit }
      : undefined,
  ),
  strokeOpacity: publishBookStrokeOpacity(
    config.strokeOpacity !== undefined
      ? { config: config.strokeOpacity }
      : undefined,
  ),
  strokeWidth: publishBookStrokeWidth(
    config.strokeWidth !== undefined
      ? { config: config.strokeWidth }
      : undefined,
  ),
  tabSize: publishBookTabSize(
    config.tabSize !== undefined
      ? { config: config.tabSize }
      : undefined,
  ),
  widows: publishBookWidows(
    config.widows !== undefined
      ? { config: config.widows }
      : undefined,
  ),
  zIndex: publishBookZIndex(
    config.zIndex !== undefined
      ? { config: config.zIndex }
      : undefined,
  ),
  zoom: publishBookZoom(
    config.zoom !== undefined ? { config: config.zoom } : undefined,
  ),
  // composed books: bound under their whole namespace (no factory config to forward).
  backdropFilter,
  positioning,
  shadows,
  supportsFallback,
  transforms,
  // color book assigned LAST so it wins the `color` slot over the calipers value fn.
  color: publishBookColor({ config: config.color }),
});

export default publishCompendium;
