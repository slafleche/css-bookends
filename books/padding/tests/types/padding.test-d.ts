import type {
  IMeasurement,
  NonNegativeMeasurement,
} from '@css-bookends/css-calipers';
import { m } from '@css-bookends/css-calipers';
import {
  anchorSize,
  type CssWideKeyword,
  type SpacingInput,
  type SpacingStore,
} from '@css-bookends/spacing';
import {
  expectAssignable,
  expectError,
  expectNotAssignable,
} from 'tsd';

import type {
  NonNegativePaddingInput,
  PaddingStyle,
} from '../../dist/esm';
import { parsePadding, storePadding } from '../../dist/esm';

// Padding excludes `auto` and `anchor-size()` at the type level.
expectError(parsePadding('auto'));
expectError(parsePadding(anchorSize({ size: 'width' })));
expectError(parsePadding({ x: 'auto' }));

// parsePadding hardens: its result is a non-negative spacing input.
const hardened = parsePadding({ top: m(4, 'px') });
expectAssignable<NonNegativePaddingInput>(hardened);
expectAssignable<
  SpacingInput<NonNegativeMeasurement, CssWideKeyword, never>
>(hardened);

// A consumer that demands the hardened input rejects a plain (un-hardened) one - the
// governing rule: the non-negative constraint lives in the type, not just at runtime.
declare function needsHardened(input: NonNegativePaddingInput): void;
needsHardened(hardened);
declare const plain: SpacingInput<
  IMeasurement,
  CssWideKeyword,
  never
>;
expectError(needsHardened(plain));

// The hardened brand survives STORAGE: storePadding's store carries NonNegativeMeasurement.
const hardenedStore = storePadding(parsePadding({ top: m(4, 'px') }));
expectAssignable<
  SpacingStore<NonNegativeMeasurement, CssWideKeyword, never>
>(hardenedStore);

declare function needsHardenedStore(
  store: SpacingStore<NonNegativeMeasurement, CssWideKeyword, never>,
): void;
needsHardenedStore(hardenedStore);
declare const plainStore: SpacingStore<
  IMeasurement,
  CssWideKeyword,
  never
>;
expectError(needsHardenedStore(plainStore));

// The hard auto-split lives in the STORE: padding's symbolic slot keyword is `CssWideKeyword`,
// so an `auto` symbolic slot is NOT assignable to a padding store. (csstype's `(string & {})`
// means the output style type cannot reject `auto`; the store tag is what enforces it.)
expectNotAssignable<
  SpacingStore<NonNegativeMeasurement, CssWideKeyword, never>
>({ left: { kind: 'symbolic', keyword: 'auto' } });

// The output style object is keyed to `padding`, with csstype values.
expectAssignable<PaddingStyle>({
  paddingTop: '4px',
  padding: '4px 8px',
});
