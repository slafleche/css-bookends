import { expectError, expectType } from 'tsd';

import {
  mPx,
  mEm,
  mPercent,
  mDeg,
  mVh,
  mMs,
  mDpi,
  measurementMin,
  measurementMax,
  type IMeasurement,
} from '../../dist/esm';

// Representative measurements spanning multiple unit categories:
// length (absolute + font-relative), percent, angle, viewport, time, resolution.
const px = mPx(10);
const em = mEm(2);
const pct = mPercent(50);
const deg = mDeg(45);
const vh = mVh(20);
const ms = mMs(100);
const dpi = mDpi(2);

// ---------------------------------------------------------------------------
// 1. Unit-preserving operations keep the unit in the type.
//    Numeric-argument and unary operations can never change the unit, so the
//    branded unit must flow through unchanged.
// ---------------------------------------------------------------------------
expectType<IMeasurement<'px'>>(px.add(4));
expectType<IMeasurement<'px'>>(px.subtract(4));
expectType<IMeasurement<'px'>>(px.multiply(2));
expectType<IMeasurement<'px'>>(px.divide(2));
expectType<IMeasurement<'px'>>(px.double());
expectType<IMeasurement<'px'>>(px.half());
expectType<IMeasurement<'px'>>(px.negation());
expectType<IMeasurement<'px'>>(px.absolute());
expectType<IMeasurement<'px'>>(px.round(2));
expectType<IMeasurement<'px'>>(px.floor());
expectType<IMeasurement<'px'>>(px.ceil());

expectType<IMeasurement<'em'>>(em.multiply(2));
expectType<IMeasurement<'%'>>(pct.double());
expectType<IMeasurement<'deg'>>(deg.negation());
expectType<IMeasurement<'vh'>>(vh.round());
expectType<IMeasurement<'ms'>>(ms.half());
expectType<IMeasurement<'dpi'>>(dpi.ceil());

// ---------------------------------------------------------------------------
// 2. Same-unit binary operations are allowed and preserve the unit.
// ---------------------------------------------------------------------------
expectType<IMeasurement<'px'>>(px.add(mPx(1)));
expectType<IMeasurement<'em'>>(em.subtract(mEm(1)));
expectType<IMeasurement<'px'>>(px.clamp(mPx(1), mPx(20)));
expectType<IMeasurement<'%'>>(measurementMin(pct, mPercent(10)));
expectType<IMeasurement<'deg'>>(measurementMax(deg, mDeg(10)));

// ---------------------------------------------------------------------------
// 3. Mismatched units are rejected at compile time (the red squiggle).
//    Every operation that combines two measurements is checked across unit
//    categories and in both directions.
// ---------------------------------------------------------------------------

// add
expectError(px.add(em));
expectError(px.add(deg));
expectError(em.add(pct));
expectError(pct.add(px));
expectError(vh.add(ms));

// subtract
expectError(px.subtract(em));
expectError(deg.subtract(px));
expectError(em.subtract(pct));
expectError(ms.subtract(dpi));
expectError(pct.subtract(vh));

// clamp - min argument off-unit
expectError(px.clamp(em, mPx(20)));
expectError(deg.clamp(ms, mDeg(90)));
expectError(pct.clamp(px, mPercent(90)));

// clamp - max argument off-unit
expectError(px.clamp(mPx(1), em));
expectError(deg.clamp(mDeg(1), ms));
expectError(vh.clamp(mVh(1), px));

// clamp - both bounds off-unit
expectError(px.clamp(em, pct));

// measurementMin / measurementMax
expectError(measurementMin(px, em));
expectError(measurementMin(deg, ms));
expectError(measurementMin(pct, vh));
expectError(measurementMax(px, pct));
expectError(measurementMax(vh, dpi));
expectError(measurementMax(em, deg));

// ---------------------------------------------------------------------------
// 4. equals / compare are NOT unit-constrained at the type level today.
//    The default runtime path throws on a mismatch, but the public interface
//    accepts any unit and does not expose the `strict` opt-out. These lines are
//    canaries: they document the current (looser) contract. If equals/compare
//    are ever tightened to require matching units, these will stop compiling
//    and this file will fail - prompting a deliberate update.
// ---------------------------------------------------------------------------
expectType<boolean>(px.equals(em));
expectType<number>(px.compare(em));
