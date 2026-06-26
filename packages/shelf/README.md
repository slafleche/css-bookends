# @css-bookends/shelf

The whole [CSS-Bookends](https://github.com/css-bookends/css-bookends) bookshelf in
one package. It re-exports every lexicon and book so you can pull the entire set
from a single import.

```bash
npm install @css-bookends/shelf
```

```ts
import { publishShelf } from "@css-bookends/shelf";

const shelf = publishShelf();

const padding = shelf.m(16);          // 16px (css-calipers)
const accent = shelf.color("#3366cc"); // the color book
```

Prefer the individual packages when you only need one concern:

- [`css-calipers`](https://www.npmjs.com/package/@css-bookends/css-calipers) (measurement lexicon)
- [`@css-bookends/color`](https://www.npmjs.com/package/@css-bookends/color)

Everything here is a flat re-export of those packages; nothing is added on top.
