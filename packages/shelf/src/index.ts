// The whole bookshelf, behind a factory. `publishShelf` is the ONLY export: there is
// no pre-built instance and no static re-exports, so the bundle's contents can't be
// imported directly - you call the factory (the "lazy import-all" path) and get every
// book bound + the lexicons in one object.
//
//   const shelf = publishShelf({ color: { output: colorFormats.rgba } });
//   shelf.color('#3366cc').darken(0.2).css();
//   shelf.m(8).css();
import {
  type ColorConfig,
  publishBookColor,
} from '@css-bookends/color';
import * as calipers from '@css-bookends/css-calipers';

/** Per-book config, forwarded to each book's factory. Only color has one today. */
export interface ShelfConfig {
  color?: Partial<ColorConfig>;
}

/**
 * The bound shelf: each book under its name + the lexicons spread by name. `color`
 * is the bound color BOOK (the factory result), so it shadows the calipers `color`
 * value primitive of the same name (excluded from the spread surface here).
 */
export type Shelf = {
  color: ReturnType<typeof publishBookColor>;
} & Omit<typeof calipers, 'color'>;

/**
 * Bind the whole shelf: each book via its own factory (under its name), with the
 * lexicons (`css-calipers`) spread straight up by their names. The color book is
 * assigned last so it wins the `color` slot over the calipers value fn.
 */
export const publishShelf = (config: ShelfConfig = {}): Shelf => ({
  ...calipers,
  color: publishBookColor({ config: config.color }),
});
