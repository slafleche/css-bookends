import { describe, expectTypeOf, it } from 'vitest';

import { colorFormats, publishBookColor } from '../../src/color';
import type { ColorString } from '../../src/formats';

/**
 * Selector hardening: a specific format selector hardens `.css()` to that format's
 * brand, and modifications preserve it. These are type-level assertions (checked by
 * `tsc`; `expectTypeOf` is a no-op at runtime). The default `.css()` stays a generic
 * `CssColor`, since which format wins is decided at runtime.
 */

describe('selector hardening', () => {
  const color = publishBookColor();

  it('hardens .css() to the selected format brand', () => {
    expectTypeOf(color('#fff').hex().css()).toEqualTypeOf<
      ColorString<'hex'>
    >();
    expectTypeOf(color('#fff').oklch().css()).toEqualTypeOf<
      ColorString<'oklch'>
    >();
    expectTypeOf(color('#fff').displayP3().css()).toEqualTypeOf<
      ColorString<'displayP3'>
    >();
  });

  it('hardens a one-off .css(format) to that format', () => {
    expectTypeOf(color('#fff').css(colorFormats.hex)).toEqualTypeOf<
      ColorString<'hex'>
    >();
    expectTypeOf(color('#fff').css(colorFormats.oklch)).toEqualTypeOf<
      ColorString<'oklch'>
    >();
  });

  it('modifications preserve the format brand', () => {
    expectTypeOf(color('#fff').hex().darken().css()).toEqualTypeOf<
      ColorString<'hex'>
    >();
    expectTypeOf(
      color('#fff').oklch().alpha(0.5).css(),
    ).toEqualTypeOf<ColorString<'oklch'>>();
  });
});
