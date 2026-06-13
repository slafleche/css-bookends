// The whole bookshelf: a flat re-export of every lexicon and book so you can
// import everything from one place. Prefer the individual packages when you only
// need one concern.
export * from '@css-bookends/css-calipers';
export * from '@css-bookends/media-queries';

// colours: a helper ALWAYS comes from its factory, never imported directly. The
// colours package ships `colours`, its default instance (the factory called with
// defaults); the shelf re-exports that, so importing the shelf gives you the
// preconfigured book. The raw `color()` value-helper is intentionally not
// surfaced. Use `colours` for defaults, or `bookPressColours` for a custom one.
export { colours, colorFormats, bookPressColours } from '@css-bookends/colours';
export type {
  Colours,
  ColoursConfig,
  ColourInput,
  CssFormat,
  FormatName,
  ResolvedColour,
} from '@css-bookends/colours';
