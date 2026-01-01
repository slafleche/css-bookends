import type { ErrorCode } from './errors';

export type MeasurementCreationErrorPayload = {
  message: string;
  context?: string;
  details: {
    code: ErrorCode;
    helper: string;
    inputSummary: string;
  };
};

export const buildMeasurementCreationError = (
  value: number,
  unit: string,
  helper: string,
  context?: string,
): MeasurementCreationErrorPayload => {
  const code: ErrorCode = 'CALIPERS_E_NONFINITE';
  return {
    message: `Non-finite measurement value: ${value}`,
    context,
    details: {
      code,
      helper,
      inputSummary: `value=${value}, unit=${unit}`,
    },
  };
};
