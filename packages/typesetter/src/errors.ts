import type { DtcgTokenType } from './types';

/**
 * Thrown when a SUPPORTED DTCG token is malformed (bad unit, non-finite value,
 * wrong value shape, unknown colorSpace, out-of-range fontWeight, ...). It is a
 * hard rejection, never a silent fallback: the typesetter refuses to emit a
 * primitive it cannot build accurately.
 *
 * Note the deliberate split from the unsupported-type path: a composite/deferred
 * `$type` returns the `{ unsupported: true }` sentinel (an expected, documented
 * deferral), whereas a malformed supported token THROWS this error.
 */
export class TypesetterError extends Error {
  /** The DTCG `$type` involved, when one is resolvable. */
  readonly tokenType?: DtcgTokenType;

  constructor(tokenType: DtcgTokenType | undefined, message: string) {
    super(
      tokenType === undefined
        ? `typesetter: ${message}`
        : `typesetter (${tokenType}): ${message}`,
    );
    this.name = 'TypesetterError';
    this.tokenType = tokenType;
  }
}
