import type { Property } from 'csstype';
import {
  expectAssignable,
  expectNotAssignable,
  expectType,
} from 'tsd';

import { fontWeight, opacity, scale, zIndex } from '../../dist/esm';

/*
 * Publish-readiness pin: the WIDTH of `.css()`'s static type.
 *
 * A css-value helper's `.css()` is typed against the property's csstype
 * `Property.X` value type. For number-valued CSS properties, csstype defines
 * `Property.X` as `Globals | (number & {})` (or with extra keyword members),
 * which WIDENS to include `number`. That is csstype's design, not a bug in this
 * package; the runtime always renders a `string`.
 *
 * These tests PIN the observable contract so a future csstype bump or refactor
 * cannot silently change it:
 *  - `.css()` is assignable TO the csstype property type (the intended use).
 *  - `.css()` is ALSO assignable to a bare `number` for number-valued props
 *    (the documented type-width caveat: do not feed `.css()` into something
 *     typed `number` and expect a number at runtime).
 *  - `.toString()` and `.value()` carry the honest string / number|string types.
 *  - For string-shaped multi-part renders (`scale`), `.css()` is a string, not
 *    a number.
 */

// 1. Intended direction: assignable to the csstype property type.
expectAssignable<Property.Opacity>(opacity(0.5).css());
expectAssignable<Property.ZIndex>(zIndex(2).css());
expectAssignable<Property.FontWeight>(fontWeight(700).css());

// 2. The csstype-width check resolves CLEAN. A number-valued `Property.X` is a
//    union that also INCLUDES `string` (e.g. `Globals | (string & {}) | (number & {})`),
//    so the whole type is NOT assignable to a bare `number`. A consumer therefore
//    cannot accidentally treat `.css()` as a number, the feared widening does not
//    materialize. These pins lock that safety in; if a future csstype bump dropped
//    the string member they would start failing and force a deliberate review.
expectNotAssignable<number>(opacity(0.5).css());
expectNotAssignable<number>(zIndex(2).css());
expectNotAssignable<number>(fontWeight(700).css());

// 3. The honest, string-true accessors. `.toString()` is always a string and
//    is NOT assignable to number. `.value()` is the raw number-or-keyword.
expectType<string>(opacity(0.5).toString());
expectNotAssignable<number>(opacity(0.5).toString());
expectAssignable<number | string>(opacity(0.5).value());

// 4. A multi-part helper whose render is a composite string is typed as a
//    string-shaped csstype value; it does NOT widen to number.
expectAssignable<Property.Scale>(scale(1, 2).css());
expectNotAssignable<number>(scale(1, 2).css());
expectType<string>(scale(1, 2).toString());
