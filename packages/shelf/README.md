# @css-bookends/shelf

The whole [CSS-Bookends](https://github.com/css-bookends/css-bookends) bookshelf in
one package. It re-exports every lexicon and book so you can pull the entire set
from a single import.

```bash
npm install @css-bookends/shelf
```

```ts
import { m, mediaQueryFactory } from "@css-bookends/shelf";

const padding = m(16);
const media = mediaQueryFactory({
  queries: { desktop: { minWidth: m(640) } },
  config: { label: "layout" },
});
```

Prefer the individual packages when you only need one concern:

- [`css-calipers`](https://www.npmjs.com/package/@css-bookends/css-calipers) (measurement lexicon)
- [`@css-bookends/media-queries`](https://www.npmjs.com/package/@css-bookends/media-queries)

Everything here is a flat re-export of those packages; nothing is added on top.
