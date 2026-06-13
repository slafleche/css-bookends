// Example: applying the compiler-agnostic supports-fallback output with
// vanilla-extract. The library itself never imports vanilla-extract; an example
// may, to show one way to consume the plain `{ selector, style }` data.
import { globalStyle } from '@vanilla-extract/css';

import { createSupportsFallback } from '../src/supportsFallback';

const applyGrid = createSupportsFallback('display: grid');

applyGrid({
  selector: [
    '.layout',
    '.layout--wide',
  ],
  supported: { display: 'grid' },
  fallback: { display: 'block' },
}).forEach(({ selector, style }) => globalStyle(selector, style));
