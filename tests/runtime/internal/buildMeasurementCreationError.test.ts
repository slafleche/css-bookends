import { describe, expect, it } from 'vitest';

import {
  buildMeasurementCreationError,
  type MeasurementCreationErrorPayload,
} from '../../../src/internal/buildMeasurementCreationError.tests';

describe('buildMeasurementCreationError', () => {
  it('builds a consistent payload with context and details', () => {
    const payload = buildMeasurementCreationError(
      Number.NaN,
      'px',
      'm',
      'tokens.cardWidth',
    );

    const expected: MeasurementCreationErrorPayload = {
      message: 'Non-finite measurement value: NaN',
      context: 'tokens.cardWidth',
      details: {
        code: 'CALIPERS_E_NONFINITE',
        helper: 'm',
        inputSummary: 'value=NaN, unit=px',
      },
    };

    expect(payload).toEqual(expected);
  });

  it('omits context when not provided', () => {
    const payload = buildMeasurementCreationError(
      Number.POSITIVE_INFINITY,
      'em',
      'mEm',
    );

    expect(payload.context).toBeUndefined();
  });
});
