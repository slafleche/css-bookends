// Core tests against the built ESM artifact in dist/esm.
import type { CoreApi } from './core.shared';
import { runCoreTests } from './core.shared';

// Dynamic import will fail fast if the ESM artifact does not exist or
// exports are incorrect.
const esmModule = await import('../../../dist/esm/index.js');

const {
  assertMatchingUnits,
  assertUnit,
  assertCondition,
  isMeasurement,
  m,
  mPercent,
  mPx,
  mCm,
  mEm,
  mVh,
  mSvw,
  mLvw,
  mDvw,
  mCqh,
  mDeg,
  mMs,
  mKhz,
  mDpi,
  mFr,
  mCqw,
  isPercentMeasurement,
  assertPercentMeasurement,
  makeUnitHelper,
  makeUnitHelperFromDefinition,
  measurementUnitMetadata,
  makeUnitAssert,
  makeUnitGuard,
  hasCssMethod,
  measurementMax,
  measurementMin,
  setErrorConfig,
  getErrorConfig,
} = esmModule;

const api = {
  m,
  mPercent,
  mPx,
  mCm,
  mEm,
  mVh,
  mSvw,
  mLvw,
  mDvw,
  mCqh,
  mDeg,
  mMs,
  mKhz,
  mDpi,
  mFr,
  mCqw,
  assertMatchingUnits,
  assertUnit,
  assertCondition,
  isMeasurement,
  isPercentMeasurement,
  assertPercentMeasurement,
  makeUnitHelper,
  makeUnitHelperFromDefinition,
  measurementUnitMetadata,
  makeUnitAssert,
  makeUnitGuard,
  hasCssMethod,
  measurementMin,
  measurementMax,
  setErrorConfig,
  getErrorConfig,
} as unknown as CoreApi;

runCoreTests('esm', api);
