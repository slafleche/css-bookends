# @css-bookends/bookpress

The press that makes books.

## Vocabulary

- **lexicon** : primitives for CSS use (measurements, colours, spacing). The raw
  vocabulary other packages build on.
- **book** : a workable library for one CSS concern (borders, shadows, ...),
  built by combining three pages.
- **press** : the definition of a book, its three pages plus config defaults.
- **bookPress** : the factory in this package. Give it a press, get a function that
  stamps out a book, able to rewrite any page or the whole press.

## The three pages of every book

1. **input** : accept many raw shapes, parse them into the canonical store.
2. **storage** : normalize the canonical store (defaults, merges, resolution).
3. **output(s)** : one or more renderers from the store to CSS (longform,
   shorthand, ...). A bare call renders the `default`.

See [`/ARCHITECTURE.md`](../ARCHITECTURE.md) for the full model.

## Usage

```ts
import { bookPress, type Press } from '@css-bookends/bookpress';

const press: Press<Raw, Store, string, Cfg> = {
  defaults: { unit: 'px' },
  input: (raw, cfg) => /* raw -> store */,
  storage: (store, cfg) => /* store -> normalized store */,
  outputs: {
    long: (store, cfg) => /* css */,
    short: (store, cfg) => /* css */,
  },
  default: 'short',
};

const makeBorders = bookPress(press);

const borders = makeBorders();                            // defaults
const rem     = makeBorders({ config: { unit: 'rem' } }); // config override
const custom  = makeBorders({ storage: myStorage });      // rewrite one page

borders(input);                  // input -> storage -> default output
borders.outputs.long(store);     // a named output, config pre-bound
borders.store(input);            // pages 1+2 only, to compose across books
bookPress(borders.press)({ ... }); // re-print, rewriting the whole press
```

## Compiler-agnostic

bookpress has no runtime dependencies and imports no CSS compiler. A book's pages
return plain data and strings; tools consume them. This is a hard rule across
CSS-Bookends.
