// The cascade reaches calipers PRIMITIVES through the compendium. A primitive
// resolves a setting as own key (calipers.<unit>) -> corpus.global
// (calipers.global) -> compendium.global -> factory default. Worked example:
// the shared `hardening` reaction. Tested at src level (only calipers needs
// building); the configured bundle must be spread so the compendium's i / f / m
// honour the config, not the bare defaults.
import { hardenInteger } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { publishCompendium } from '../src/index';

describe('compendium config cascade -> calipers primitives', () => {
  it('compendium.global reaches the primitives (ignore)', () => {
    const c = publishCompendium({ global: { hardening: 'ignore' } });
    expect(c.i(8, { min: 0, max: 10 }).multiply(2).value()).toBe(16);
  });

  it('the nested calipers key configures a primitive (integer)', () => {
    const c = publishCompendium({
      calipers: { integer: { hardening: 'ignore' } },
    });
    expect(c.i(8, { min: 0, max: 10 }).multiply(2).value()).toBe(16);
  });

  it('corpus global (calipers.global) overrides compendium global', () => {
    const c = publishCompendium({
      global: { hardening: 'fail' },
      calipers: { global: { hardening: 'ignore' } },
    });
    expect(c.i(8, { min: 0, max: 10 }).multiply(2).value()).toBe(16);
  });

  it('factory default (fail) when neither is set', () => {
    const c = publishCompendium();
    expect(() => c.i(8, { min: 0, max: 10 }).multiply(2)).toThrow(
      /maximum/,
    );
  });

  it('measurements too: compendium.global reaches m', () => {
    const c = publishCompendium({ global: { hardening: 'ignore' } });
    expect(
      c
        .m(hardenInteger({ min: 0, max: 10 })(8))
        .multiply(2)
        .css(),
    ).toBe('16px');
  });
});
