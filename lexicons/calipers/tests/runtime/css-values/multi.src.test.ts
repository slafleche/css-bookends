import { describe, expect, it } from 'vitest';

import {
  borderImageOutset,
  borderImageSlice,
  borderImageWidth,
  counterIncrement,
  counterReset,
  counterSet,
  gridColumnEnd,
  gridColumnStart,
  gridRowEnd,
  gridRowStart,
  maskBorderOutset,
  maskBorderSlice,
  maskBorderWidth,
  scale,
  span,
  strokeDasharray,
  strokeDashoffset,
  strokeWidth,
  tabSize,
} from '../../../src/css-values';
import { mPx } from '../../../src/units/absolute';

describe('Multi-part CSS-value helpers (src)', () => {
  describe('counters', () => {
    it('renders a single ident with the default integer', () => {
      // reset/set default to 0, increment defaults to 1.
      expect(counterReset('page').css()).toBe('page 0');
      expect(counterSet('page').css()).toBe('page 0');
      expect(counterIncrement('page').css()).toBe('page 1');
    });

    it('renders an explicit integer via a tuple', () => {
      expect(
        counterReset([
          'page',
          3,
        ]).css(),
      ).toBe('page 3');
      expect(
        counterIncrement([
          'section',
          -2,
        ]).css(),
      ).toBe('section -2');
    });

    it('renders multiple entries in order', () => {
      expect(
        counterReset(
          [
            'a',
            1,
          ],
          'b',
          [
            'c',
            4,
          ],
        ).css(),
      ).toBe('a 1 b 0 c 4');
    });

    it('passes the none keyword through', () => {
      expect(counterReset('none').css()).toBe('none');
      expect(counterReset('none').value()).toBe('none');
      expect(counterReset('none').toString()).toBe('none');
    });

    it('mirrors .css() in .toString() and .value()', () => {
      const v = counterIncrement([
        'x',
        2,
      ]);
      expect(v.toString()).toBe('x 2');
      expect(v.value()).toBe('x 2');
    });

    it('rejects a non-integer counter value', () => {
      expect(() =>
        counterReset([
          'page',
          1.5,
        ]),
      ).toThrow(/expected an integer/);
    });

    it('rejects an invalid custom-ident', () => {
      expect(() =>
        counterReset([
          '1bad',
          0,
        ]),
      ).toThrow(/not a valid <custom-ident>/);
      expect(() => counterReset('has space')).toThrow(
        /not a valid <custom-ident>/,
      );
    });

    it('rejects none combined with entries (runtime guard)', () => {
      // 'none' combined with entries is type-valid but rejected at runtime.
      expect(() => counterReset('none', 'page')).toThrow(
        /cannot be combined/,
      );
    });
  });

  describe('grid lines', () => {
    it('renders a nonzero line number', () => {
      expect(gridRowStart(2).css()).toBe('2');
      expect(gridColumnEnd(-1).css()).toBe('-1');
    });

    it('rejects line number 0', () => {
      expect(() => gridRowStart(0)).toThrow(/must be nonzero/);
    });

    it('rejects a non-integer line number', () => {
      expect(() => gridColumnStart(1.5)).toThrow(
        /expected an integer/,
      );
    });

    it('renders the auto keyword', () => {
      expect(gridRowEnd('auto').css()).toBe('auto');
    });

    it('renders a named line (custom-ident)', () => {
      expect(gridColumnStart('main-start').css()).toBe('main-start');
    });

    it('renders span N', () => {
      expect(gridColumnEnd(span(2)).css()).toBe('span 2');
      expect(gridRowStart(span(3, 'main')).css()).toBe('span 3 main');
    });

    it('rejects span N below 1', () => {
      expect(() => gridColumnEnd(span(0))).toThrow(
        /below the minimum/,
      );
    });

    it('rejects a bare span string', () => {
      expect(() => gridRowStart('span')).toThrow(/use span\(n\)/);
    });

    it('rejects an invalid named line', () => {
      expect(() => gridColumnStart('1bad')).toThrow(
        /not a valid <custom-ident>/,
      );
    });
  });

  describe('scale', () => {
    it('renders one to three factors', () => {
      expect(scale(2).css()).toBe('2');
      expect(scale(1, 0.5).css()).toBe('1 0.5');
      expect(scale(1, 2, 3).css()).toBe('1 2 3');
    });

    it('allows negative factors', () => {
      expect(scale(-1, 1).css()).toBe('-1 1');
    });

    it('renders the none keyword', () => {
      expect(scale('none').css()).toBe('none');
    });

    it('rejects a non-finite factor', () => {
      expect(() => scale(Infinity)).toThrow(/finite/);
    });
  });

  describe('tab-size', () => {
    it('renders a non-negative number (not restricted to integer)', () => {
      expect(tabSize(4).css()).toBe('4');
      expect(tabSize(2.5).css()).toBe('2.5');
      expect(tabSize(0).css()).toBe('0');
    });

    it('rejects a negative number', () => {
      expect(() => tabSize(-1)).toThrow(/below the minimum/);
    });

    it('renders a length measurement', () => {
      expect(tabSize(mPx(8)).css()).toBe('8px');
    });
  });

  describe('border-image-width / mask-border-width', () => {
    it('renders one to four number multipliers', () => {
      expect(borderImageWidth(1).css()).toBe('1');
      expect(borderImageWidth(1, 2).css()).toBe('1 2');
      expect(borderImageWidth(1, 2, 3, 4).css()).toBe('1 2 3 4');
      expect(maskBorderWidth(2.5).css()).toBe('2.5');
    });

    it('renders length measurements and the auto keyword per edge', () => {
      expect(borderImageWidth(mPx(10)).css()).toBe('10px');
      expect(borderImageWidth('auto', mPx(4), 2).css()).toBe(
        'auto 4px 2',
      );
      expect(maskBorderWidth('auto').css()).toBe('auto');
    });

    it('rejects a negative number', () => {
      expect(() => borderImageWidth(-1)).toThrow(/below the minimum/);
      expect(() => maskBorderWidth(-1)).toThrow(/below the minimum/);
    });

    it('rejects more than four entries', () => {
      expect(() => borderImageWidth(1, 2, 3, 4, 5)).toThrow(
        /1 to 4 entries/,
      );
    });

    it('rejects an unknown keyword', () => {
      expect(() => borderImageWidth('fill')).toThrow(
        /not a valid keyword/,
      );
    });
  });

  describe('border-image-outset / mask-border-outset', () => {
    it('renders one to four numbers or lengths', () => {
      expect(borderImageOutset(0).css()).toBe('0');
      expect(borderImageOutset(1, mPx(2)).css()).toBe('1 2px');
      expect(maskBorderOutset(1, 2, 3, 4).css()).toBe('1 2 3 4');
    });

    it('rejects a negative number', () => {
      expect(() => borderImageOutset(-1)).toThrow(
        /below the minimum/,
      );
    });

    it('rejects the auto keyword (outset has no auto)', () => {
      expect(() => borderImageOutset('auto')).toThrow(
        /not a valid keyword/,
      );
    });

    it('rejects an entry that is neither a <number> nor an IMeasurement', () => {
      // a non-string, non-number, non-measurement entry falls through to the
      // renderNumberOrLength type guard, which names the helper and the bad type.
      expect(() =>
        borderImageOutset(
          // deliberately wrong type to reach the runtime guard.
          {} as unknown as number,
        ),
      ).toThrow(
        /borderImageOutset: expected a <number> or an IMeasurement \(got object\)/,
      );
      expect(() =>
        borderImageOutset(true as unknown as number),
      ).toThrow(/got boolean/);
    });
  });

  describe('border-image-slice / mask-border-slice', () => {
    it('renders one to four numbers', () => {
      expect(borderImageSlice(30).css()).toBe('30');
      expect(borderImageSlice(10, 20, 30, 40).css()).toBe(
        '10 20 30 40',
      );
      expect(maskBorderSlice(5).css()).toBe('5');
    });

    it('renders an optional trailing fill keyword', () => {
      expect(borderImageSlice(30, 'fill').css()).toBe('30 fill');
      expect(borderImageSlice(10, 20, 30, 40, 'fill').css()).toBe(
        '10 20 30 40 fill',
      );
      expect(maskBorderSlice(7, 'fill').css()).toBe('7 fill');
    });

    it('rejects a negative number', () => {
      expect(() => borderImageSlice(-1)).toThrow(/below the minimum/);
    });

    it('rejects fill in a non-trailing position', () => {
      // @ts-expect-error fill is only allowed as the trailing keyword.
      expect(() => borderImageSlice('fill', 10)).toThrow();
      expect(() => borderImageSlice(10, 'fill', 20)).toThrow(
        /only appear as the trailing keyword/,
      );
    });

    it('rejects more than four numbers (excluding fill)', () => {
      expect(() => borderImageSlice(1, 2, 3, 4, 5)).toThrow(
        /1 to 4 numbers/,
      );
    });

    it('rejects a length measurement (slice is number-only)', () => {
      // @ts-expect-error slice does not accept an IMeasurement.
      expect(() => borderImageSlice(mPx(10))).toThrow();
    });
  });

  describe('stroke-width', () => {
    it('renders a non-negative number or a length', () => {
      expect(strokeWidth(2).css()).toBe('2');
      expect(strokeWidth(0).css()).toBe('0');
      expect(strokeWidth(mPx(3)).css()).toBe('3px');
    });

    it('rejects a negative number', () => {
      expect(() => strokeWidth(-1)).toThrow(/below the minimum/);
    });
  });

  describe('stroke-dashoffset', () => {
    it('renders any number or a length', () => {
      expect(strokeDashoffset(5).css()).toBe('5');
      expect(strokeDashoffset(-5).css()).toBe('-5');
      expect(strokeDashoffset(mPx(8)).css()).toBe('8px');
    });

    it('rejects a non-finite number', () => {
      expect(() => strokeDashoffset(Infinity)).toThrow(/finite/);
    });
  });

  describe('stroke-dasharray', () => {
    it('renders a list of numbers and/or lengths', () => {
      expect(strokeDasharray(4).css()).toBe('4');
      expect(strokeDasharray(4, 2).css()).toBe('4 2');
      expect(strokeDasharray(4, mPx(2), 1).css()).toBe('4 2px 1');
    });

    it('renders the none keyword', () => {
      expect(strokeDasharray('none').css()).toBe('none');
    });

    it('rejects a negative number', () => {
      expect(() => strokeDasharray(-1)).toThrow(/below the minimum/);
    });

    it('rejects none combined with entries', () => {
      // @ts-expect-error 'none' takes no further entries.
      expect(() => strokeDasharray('none', 4)).toThrow(
        /cannot be combined/,
      );
    });
  });
});
