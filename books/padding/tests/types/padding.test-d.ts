import type {
  IMeasurement,
  NonNegativeMeasurement,
} from '@css-bookends/css-calipers';
import { m } from '@css-bookends/css-calipers';
import {
  anchorSize,
  type CssWideKeyword,
  type SpacingInput,
} from '@css-bookends/spacing';
import { expectAssignable, expectError } from 'tsd';

import type { NonNegativePaddingInput } from '../../dist/esm';
import { parsePadding } from '../../dist/esm';

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
