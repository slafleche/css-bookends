import { expectAssignable } from 'tsd';

import {
  m,
  mPx,
  mPercent,
  isMeasurement,
  isPercentMeasurement,
  assertPercentMeasurement,
  measurementUnitMetadata,
  type IMeasurement,
  type MeasurementString,
  type MeasurementUnitDefinition,
  type MeasurementUnitCategory,
} from '../../dist/esm';

// Core constructor and helpers are available from the public entry
const apiMeasurement = m(10, 'px');
expectAssignable<IMeasurement<'px'>>(apiMeasurement);

const apiPxMeasurement = mPx(4);
expectAssignable<IMeasurement<'px'>>(apiPxMeasurement);

const apiPercentMeasurement = mPercent(50);
expectAssignable<IMeasurement<'%'>>(apiPercentMeasurement);

// Guards and assertions are exported with the expected shapes
declare const unknownValue: unknown;

if (isMeasurement(unknownValue)) {
  expectAssignable<IMeasurement<string>>(unknownValue);
}

if (isPercentMeasurement(unknownValue)) {
  expectAssignable<IMeasurement<'%'>>(unknownValue);
}

declare let maybePercentValue: unknown;

const useApiAssertPercent = () => {
  assertPercentMeasurement(maybePercentValue);
  expectAssignable<IMeasurement<'%'>>(maybePercentValue);
};

// MeasurementString and unit metadata types are exported and coherent
declare const pxCss: MeasurementString<'px'>;
expectAssignable<string>(pxCss);

const percentMeta = measurementUnitMetadata.mPercent;
expectAssignable<MeasurementUnitDefinition>(percentMeta);

declare const category: MeasurementUnitCategory;
void category;
