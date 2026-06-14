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
import * as mediaQueries from '@css-bookends/media-queries';

/** Per-book config, forwarded to each book's factory. Only color has one today. */
export interface ShelfConfig {
  color?: Partial<ColorConfig>;
}

/** The bound shelf: each book under its name + the lexicons spread by name. */
export type Shelf = {
  color: ReturnType<typeof publishBookColor>;
} & typeof calipers &
  typeof mediaQueries;

/**
 * Bind the whole shelf: each book via its own factory (under its name), with the
 * lexicons (`css-calipers`, `media-queries`) spread straight up by their names.
 */
export const publishShelf = (config: ShelfConfig = {}): Shelf => ({
  color: publishBookColor({ config: config.color }),
  ...calipers,
  ...mediaQueries,
});
