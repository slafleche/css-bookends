/**
 * The default colours book: the factory called once with the built-in defaults.
 *
 * This is the canonical import for the colours helper. Per AGENTS.md, a helper is
 * consumed from a factory, never as the raw `color()` value-helper. Import
 * `colours` from here (or re-exported via the shelf). Call `bookPressColours(config)`
 * yourself only when you need different defaults.
 */
import { bookPressColours } from './colours';

export const colours = bookPressColours();
