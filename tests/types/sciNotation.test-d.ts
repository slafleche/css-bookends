import { expectType, expectAssignable } from 'tsd';

import {
  sciNotation,
  isSciNotation,
  m,
  type ISciNotation,
  type InscribedMeasurement,
  type BrandedMeasurement,
  type IMeasurement,
} from '../../dist/esm';

// sciNotation returns an ISciNotation primitive (not a measurement)
const sci = sciNotation(1.5, -7, 'px');
expectAssignable<ISciNotation>(sci);
expectType<number>(sci.coefficient());
expectType<number>(sci.exponent());
expectType<string>(sci.getUnit());
expectType<number>(sci.valueOf());
expectType<number>(sci.getValue());
expectType<string>(sci.css());

// with* helpers return ISciNotation
expectAssignable<ISciNotation>(sci.withCoefficient(2));
expectAssignable<ISciNotation>(sci.withExponent(-3));

// unit is optional (defaults to px)
expectAssignable<ISciNotation>(sciNotation(2, 2));

// isSciNotation narrows unknown to ISciNotation
declare const maybeSci: unknown;
if (isSciNotation(maybeSci)) {
  expectAssignable<ISciNotation>(maybeSci);
}

// InscribedMeasurement is the canonical name; BrandedMeasurement is a
// deprecated alias that must remain assignable to it for one release.
const px = m(10);
expectAssignable<InscribedMeasurement<'px'>>(px);
expectAssignable<BrandedMeasurement<'px'>>(px);
expectAssignable<IMeasurement<'px'>>(px);

declare const inscribed: InscribedMeasurement<'px'>;
declare const branded: BrandedMeasurement<'px'>;
expectAssignable<InscribedMeasurement<'px'>>(branded);
expectAssignable<BrandedMeasurement<'px'>>(inscribed);
