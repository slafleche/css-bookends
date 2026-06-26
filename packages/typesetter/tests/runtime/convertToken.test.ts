import { describe, expect, it } from 'vitest';

import type {
  ConvertResult,
  DtcgToken,
} from '../../dist/esm/index.js';

// The runtime API surface is exercised through the BUILT output (like the other
// packages' runtime tests), so this also proves the dist bundle is wired right.
const pkg = await import('../../dist/cjs/index.js');
const { convertToken, TypesetterError } = pkg;

/* A tiny helper. These runtime tests exercise the BUILT (untyped via require())
 * output and probe the result shape directly, so the helper is intentionally
 * `any`-typed — the per-case runtime assertions ARE the contract here. A typed
 * static-narrowing block at the bottom of this file covers the discriminated
 * union's compile-time surface (checked by `tsc -p tsconfig.json --noEmit`). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convert = (token: unknown): any => convertToken(token as any);

/* ============================================================================
 * SUPPORTED — dimension. Asserts the chosen primitive (measurement), the unit
 * carried through (the hardening into a typed unit), and the .css() output.
 * Covers each DTCG dimension unit (px, rem) and a malformed token.
 * ==========================================================================*/
describe('dimension -> m(value, unit)', () => {
  it('px: converts to a px measurement and renders "16px"', () => {
    const r = convert({
      $type: 'dimension',
      $value: { value: 16, unit: 'px' },
    });
    expect(r.kind).toBe('measurement');
    expect(r.type).toBe('dimension');
    expect(r.value.getUnit()).toBe('px');
    expect(r.value.getValue()).toBe(16);
    expect(r.value.css()).toBe('16px');
  });

  it('rem: converts to a rem measurement and renders "1.5rem"', () => {
    const r = convert({
      $type: 'dimension',
      $value: { value: 1.5, unit: 'rem' },
    });
    expect(r.kind).toBe('measurement');
    expect(r.value.getUnit()).toBe('rem');
    expect(r.value.css()).toBe('1.5rem');
  });

  it('zero and negative dimensions are accepted', () => {
    expect(
      convert({
        $type: 'dimension',
        $value: { value: 0, unit: 'px' },
      }).value.css(),
    ).toBe('0px');
    expect(
      convert({
        $type: 'dimension',
        $value: { value: -8, unit: 'px' },
      }).value.css(),
    ).toBe('-8px');
  });

  it('rejects an unsupported dimension unit (no silent conversion)', () => {
    expect(() =>
      convert({
        $type: 'dimension',
        $value: { value: 16, unit: 'em' },
      }),
    ).toThrow(TypesetterError);
  });

  it('rejects a non-finite / non-object dimension value', () => {
    expect(() =>
      convert({
        $type: 'dimension',
        $value: { value: Number.NaN, unit: 'px' },
      }),
    ).toThrow(TypesetterError);
    expect(() =>
      convert({ $type: 'dimension', $value: '16px' }),
    ).toThrow(TypesetterError);
  });
});

/* ============================================================================
 * SUPPORTED — duration. A time measurement: m(value, unit) for ms | s.
 * ==========================================================================*/
describe('duration -> m(value, unit)', () => {
  it('ms: renders "200ms"', () => {
    const r = convert({
      $type: 'duration',
      $value: { value: 200, unit: 'ms' },
    });
    expect(r.kind).toBe('measurement');
    expect(r.type).toBe('duration');
    expect(r.value.getUnit()).toBe('ms');
    expect(r.value.css()).toBe('200ms');
  });

  it('s: renders "0.3s"', () => {
    const r = convert({
      $type: 'duration',
      $value: { value: 0.3, unit: 's' },
    });
    expect(r.value.getUnit()).toBe('s');
    expect(r.value.css()).toBe('0.3s');
  });

  it('rejects an unsupported duration unit', () => {
    expect(() =>
      convert({
        $type: 'duration',
        $value: { value: 5, unit: 'min' },
      }),
    ).toThrow(TypesetterError);
  });
});

/* ============================================================================
 * SUPPORTED — number. The most-constrained-accurate rule: i(n) for an integer,
 * f(n) for a fractional value.
 * ==========================================================================*/
describe('number -> i(n) if integer, else f(n)', () => {
  it('integer: picks i() (kind "integer") and renders "2"', () => {
    const r = convert({ $type: 'number', $value: 2 });
    expect(r.kind).toBe('integer');
    expect(r.type).toBe('number');
    expect(r.value.css()).toBe('2');
  });

  it('integer-valued zero and negatives still pick i()', () => {
    expect(convert({ $type: 'number', $value: 0 }).kind).toBe(
      'integer',
    );
    expect(convert({ $type: 'number', $value: -3 }).kind).toBe(
      'integer',
    );
  });

  it('fractional: picks f() (kind "float") and renders "1.5"', () => {
    const r = convert({ $type: 'number', $value: 1.5 });
    expect(r.kind).toBe('float');
    expect(r.value.css()).toBe('1.5');
  });

  it('rejects a non-finite number value', () => {
    expect(() =>
      convert({ $type: 'number', $value: Number.POSITIVE_INFINITY }),
    ).toThrow(TypesetterError);
    expect(() => convert({ $type: 'number', $value: '3' })).toThrow(
      TypesetterError,
    );
  });
});

/* ============================================================================
 * SUPPORTED — fontWeight. Numeric is hardened into the constrained [1, 1000]
 * integer; a keyword passes through; out-of-range numbers are rejected.
 * ==========================================================================*/
describe('fontWeight -> constrained [1,1000] integer or keyword', () => {
  it('numeric: hardens into an integer and renders "700"', () => {
    const r = convert({ $type: 'fontWeight', $value: 700 });
    expect(r.kind).toBe('fontWeight');
    expect(r.type).toBe('fontWeight');
    expect(r.value.constraints()).toEqual({ min: 1, max: 1000 });
    expect(r.value.css()).toBe('700');
  });

  it('accepts the inclusive bounds 1 and 1000', () => {
    expect(
      convert({ $type: 'fontWeight', $value: 1 }).value.css(),
    ).toBe('1');
    expect(
      convert({ $type: 'fontWeight', $value: 1000 }).value.css(),
    ).toBe('1000');
  });

  it('keyword: passes through verbatim (kind "keyword")', () => {
    const r = convert({ $type: 'fontWeight', $value: 'bold' });
    expect(r.kind).toBe('keyword');
    expect(r.value).toBe('bold');
    const normal = convert({ $type: 'fontWeight', $value: 'normal' });
    expect(normal.kind).toBe('keyword');
    expect(normal.value).toBe('normal');
  });

  it('rejects an out-of-range numeric fontWeight (0, 1001)', () => {
    expect(() => convert({ $type: 'fontWeight', $value: 0 })).toThrow(
      TypesetterError,
    );
    expect(() =>
      convert({ $type: 'fontWeight', $value: 1001 }),
    ).toThrow(TypesetterError);
  });

  it('rejects a non-integer numeric fontWeight', () => {
    expect(() =>
      convert({ $type: 'fontWeight', $value: 450.5 }),
    ).toThrow(TypesetterError);
  });

  it('rejects an unknown fontWeight keyword', () => {
    expect(() =>
      convert({ $type: 'fontWeight', $value: 'chonky' }),
    ).toThrow(TypesetterError);
  });
});

/* ============================================================================
 * SUPPORTED — color is a FULL ResolvedColor (#28 combination test). The converted
 * colour value is not a render-only stub: it can be MODIFIED and have a format
 * SELECTED before rendering, exactly like any calipers colour, so a converted
 * token survives a modify-then-render round trip.
 * ==========================================================================*/
describe('color -> a full ResolvedColor (modify + format before render)', () => {
  const srgbToken = {
    $type: 'color',
    $value: {
      colorSpace: 'srgb',
      components: [
        0.2,
        0.4,
        0.6,
      ],
    },
  };

  it('the converted colour can be modified before rendering', () => {
    const base = convert(srgbToken).value.css(); // '#336699'
    const darker = convert(srgbToken).value.darken(0.2).rgba().css();
    expect(darker).toMatch(/^rgba\(/);
    expect(darker).not.toBe(base);
  });

  it('the converted colour exposes a format selector before rendering', () => {
    expect(convert(srgbToken).value.oklch().css()).toMatch(
      /^oklch\(/,
    );
  });
});

/* ============================================================================
 * SUPPORTED — color. Several input forms across colorSpaces; the exact
 * primitive (a resolved color) and the .css() output are asserted. Outputs were
 * verified against the live calipers color engine.
 * ==========================================================================*/
describe('color -> color(...)', () => {
  it('srgb (0..1 components) -> hex "#336699"', () => {
    const r = convert({
      $type: 'color',
      $value: {
        colorSpace: 'srgb',
        components: [
          0.2,
          0.4,
          0.6,
        ],
      },
    });
    expect(r.kind).toBe('color');
    expect(r.type).toBe('color');
    expect(r.value.css()).toBe('#336699');
  });

  it('srgb pure red -> "#ff0000"', () => {
    expect(
      convert({
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: [
            1,
            0,
            0,
          ],
        },
      }).value.css(),
    ).toBe('#ff0000');
  });

  it('srgb with alpha -> rgba "rgba(0, 102, 204, 0.5)"', () => {
    expect(
      convert({
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: [
            0,
            0.4,
            0.8,
          ],
          alpha: 0.5,
        },
      }).value.css(),
    ).toBe('rgba(0, 102, 204, 0.5)');
  });

  it('srgb fully transparent -> "transparent"', () => {
    expect(
      convert({
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: [
            0,
            0,
            0,
          ],
          alpha: 0,
        },
      }).value.css(),
    ).toBe('transparent');
  });

  it('hsl [210,50,40] -> "#336699"', () => {
    expect(
      convert({
        $type: 'color',
        $value: {
          colorSpace: 'hsl',
          components: [
            210,
            50,
            40,
          ],
        },
      }).value.css(),
    ).toBe('#336699');
  });

  it('hwb [90,20,30] -> "#73b333"', () => {
    expect(
      convert({
        $type: 'color',
        $value: {
          colorSpace: 'hwb',
          components: [
            90,
            20,
            30,
          ],
        },
      }).value.css(),
    ).toBe('#73b333');
  });

  it('lab [50,40,-30] -> "#a55bab"', () => {
    expect(
      convert({
        $type: 'color',
        $value: {
          colorSpace: 'lab',
          components: [
            50,
            40,
            -30,
          ],
        },
      }).value.css(),
    ).toBe('#a55bab');
  });

  it('lch [50,40,120] -> "#638038"', () => {
    expect(
      convert({
        $type: 'color',
        $value: {
          colorSpace: 'lch',
          components: [
            50,
            40,
            120,
          ],
        },
      }).value.css(),
    ).toBe('#638038');
  });

  it('oklab [0.6,0.1,-0.05] -> "#a8669c"', () => {
    expect(
      convert({
        $type: 'color',
        $value: {
          colorSpace: 'oklab',
          components: [
            0.6,
            0.1,
            -0.05,
          ],
        },
      }).value.css(),
    ).toBe('#a8669c');
  });

  it('oklch wide-gamut [0.7,0.15,200] -> renders oklch(...)', () => {
    expect(
      convert({
        $type: 'color',
        $value: {
          colorSpace: 'oklch',
          components: [
            0.7,
            0.15,
            200,
          ],
        },
      }).value.css(),
    ).toBe('oklch(0.7 0.15 200 / 1)');
  });

  it('display-p3 (wide-gamut, color() string path) -> renders oklch(...)', () => {
    expect(
      convert({
        $type: 'color',
        $value: {
          colorSpace: 'display-p3',
          components: [
            1,
            0,
            0,
          ],
        },
      }).value.css(),
    ).toBe('oklch(0.6486 0.2995 28.96 / 1)');
  });

  it('srgb-linear (wide-gamut path) -> hex "#bcbcbc"', () => {
    expect(
      convert({
        $type: 'color',
        $value: {
          colorSpace: 'srgb-linear',
          components: [
            0.5,
            0.5,
            0.5,
          ],
        },
      }).value.css(),
    ).toBe('#bcbcbc');
  });

  it('rejects an unknown colorSpace', () => {
    expect(() =>
      convert({
        $type: 'color',
        $value: {
          colorSpace: 'cmyk',
          components: [
            0,
            0,
            0,
            0,
          ],
        },
      }),
    ).toThrow(TypesetterError);
  });

  it('rejects a malformed color value (components not an array)', () => {
    expect(() =>
      convert({
        $type: 'color',
        $value: { colorSpace: 'srgb', components: '#fff' },
      }),
    ).toThrow(TypesetterError);
  });

  it('rejects non-finite color components', () => {
    expect(() =>
      convert({
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: [
            Number.NaN,
            0,
            0,
          ],
        },
      }),
    ).toThrow(TypesetterError);
  });
});

/* ============================================================================
 * UNSUPPORTED / COMPOSITE — the eight deferred DTCG types. Each asserts the
 * explicit, documented deferral sentinel ({ unsupported: true, type }), never a
 * silent or wrong conversion. This is the (TBD) composite workflow.
 * ==========================================================================*/
describe('unsupported / composite types -> explicit deferral', () => {
  const deferred: Array<
    [
      string,
      unknown,
    ]
  > = [
    [
      'fontFamily',
      [
        'Inter',
        'sans-serif',
      ],
    ],
    [
      'cubicBezier',
      [
        0.4,
        0,
        0.2,
        1,
      ],
    ],
    [
      'strokeStyle',
      'dashed',
    ],
    [
      'border',
      {
        color: {
          colorSpace: 'srgb',
          components: [
            0,
            0,
            0,
          ],
        },
        width: { value: 1, unit: 'px' },
        style: 'solid',
      },
    ],
    [
      'transition',
      {
        duration: { value: 200, unit: 'ms' },
        delay: { value: 0, unit: 'ms' },
        timingFunction: [
          0.4,
          0,
          0.2,
          1,
        ],
      },
    ],
    [
      'shadow',
      {
        color: {
          colorSpace: 'srgb',
          components: [
            0,
            0,
            0,
          ],
        },
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 2, unit: 'px' },
        blur: { value: 4, unit: 'px' },
        spread: { value: 0, unit: 'px' },
      },
    ],
    [
      'gradient',
      {
        angle: { value: 90, unit: 'deg' },
        stops: [],
      },
    ],
    [
      'typography',
      {
        fontFamily: 'Inter',
        fontSize: { value: 16, unit: 'px' },
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: { value: 0, unit: 'px' },
      },
    ],
  ];

  for (const [
    type,
    value,
  ] of deferred) {
    it(`defers "${type}" with { unsupported: true, type } (no throw)`, () => {
      const r = convert({ $type: type, $value: value });
      expect(r.unsupported).toBe(true);
      expect(r.type).toBe(type);
      expect(typeof r.reason).toBe('string');
      // a deferral is NOT a converted primitive
      expect('value' in r).toBe(false);
    });
  }

  it('covers all eight composite/unsupported types exactly', () => {
    expect(
      deferred
        .map(
          ([
            type,
          ]) => type,
        )
        .sort(),
    ).toEqual(
      [
        'border',
        'cubicBezier',
        'fontFamily',
        'gradient',
        'shadow',
        'strokeStyle',
        'transition',
        'typography',
      ].sort(),
    );
  });
});

/* ============================================================================
 * Envelope-level rejections: a missing/unknown $type is the parser's job, not a
 * conversion. These throw (not deferral sentinels).
 * ==========================================================================*/
describe('malformed envelope -> throws', () => {
  it('throws when $type is missing (no resolved type)', () => {
    expect(() =>
      convert({ $value: { value: 1, unit: 'px' } }),
    ).toThrow(TypesetterError);
  });

  it('throws on an unknown $type', () => {
    expect(() => convert({ $type: 'bogus', $value: 1 })).toThrow(
      TypesetterError,
    );
  });

  it('throws when given a non-object token', () => {
    expect(() => convert(null)).toThrow(TypesetterError);
    expect(() => convert('not a token')).toThrow(TypesetterError);
  });
});

/* ============================================================================
 * STATIC TYPE SURFACE — compile-time coverage of the discriminated `ConvertResult`
 * union. This block never runs (guarded by `false`); `tsc -p tsconfig.json
 * --noEmit` typechecks it, proving the public types narrow as designed.
 * ==========================================================================*/
describe('static type narrowing (compile-time only)', () => {
  it('narrows ConvertResult by its discriminant', () => {
    if (false as boolean) {
      const token: DtcgToken = {
        $type: 'dimension',
        $value: { value: 16, unit: 'px' },
      };
      // typedConvert is the real (typed) entry point, not the `any` helper.
      const typedConvert: (t: DtcgToken) => ConvertResult =
        convertToken;
      const r = typedConvert(token);
      if ('unsupported' in r) {
        // deferral branch: a documented sentinel, no calipers value.
        const reason: string = r.reason;
        void reason;
      } else if (r.kind === 'keyword') {
        // a fontWeight keyword passthrough: value is the keyword string.
        const weight: string = r.value;
        void weight;
      } else {
        // every other branch carries a calipers primitive with `.css()`.
        const css: string = r.value.css();
        void css;
      }
    }
    expect(true).toBe(true);
  });
});
