import { m } from '@css-bookends/css-calipers';
import { anchorSize } from '@css-bookends/spacing';
import { expectAssignable } from 'tsd';

import type { MarginStore, MarginStyle } from '../../dist/esm';
import { storeMargin } from '../../dist/esm';

/*
 * The margin BOOK's type surface. Margin's domain is the spacing lexicon's permissive default:
 * `auto`, negatives, and `anchor-size()` are all first-class. This is the positive half of the
 * auto-split (padding's tsd asserts the negative half: an `auto` slot is not a padding store).
 */

// `auto` is a first-class margin value - both as a symbolic STORE slot...
expectAssignable<MarginStore>({
  left: { kind: 'symbolic', keyword: 'auto' },
});
expectAssignable<MarginStore>(storeMargin({ left: 'auto' }));

// ...and in the OUTPUT style object (csstype `Property.Margin` includes `auto`).
expectAssignable<MarginStyle>({ marginTop: 'auto' });
expectAssignable<MarginStyle>({ margin: '4px 8px' });

// margin also accepts negatives and `anchor-size()` (no narrowing, no hardening).
expectAssignable<MarginStore>(storeMargin(m(-4)));
expectAssignable<MarginStore>(
  storeMargin({ top: anchorSize({ size: 'width' }) }),
);
