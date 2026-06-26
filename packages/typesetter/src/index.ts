// @css-bookends/typesetter (v0): the low-level mechanical converters that set a
// single DTCG token into the most-constrained-yet-accurate calipers primitive.
//
// SCOPE IS DELIBERATELY MINIMAL. This package is ONLY the per-token converters.
// There is no document parser, no `:root` generator, no config system, and no
// orchestration; that pipeline is TBD. The public surface is `convertToken`
// plus its result/error types.
//
//   import { convertToken } from '@css-bookends/typesetter';
//   const r = convertToken({ $type: 'dimension', $value: { value: 16, unit: 'px' } });
//   if ('unsupported' in r) { /* deferred composite */ }
//   else r.value.css(); // -> "16px"

export {
  type ConvertedToken,
  type ConvertResult,
  convertToken,
} from './convert';
export { TypesetterError } from './errors';
export type {
  ColorValue,
  ConvertedKind,
  DimensionUnit,
  DimensionValue,
  DtcgColorSpace,
  DtcgToken,
  DtcgTokenMeta,
  DtcgTokenType,
  DurationUnit,
  DurationValue,
  FontWeightKeyword,
  SupportedTokenType,
  UnsupportedResult,
  UnsupportedTokenType,
} from './types';
