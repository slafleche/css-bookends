import { mDpi, mDppx, mEm, mPx, r } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import {
  buildMediaQueryFromFeatures,
  buildMediaQueryString,
  createMediaQueryBuilder,
  emitCustomFeatures,
  emitDimensionsFeatures,
  emitResolutionFeatures,
  mediaQueryFactory,
} from '../../../src/mediaQueries';
import {
  mediaQueryOutputVanillaExtract,
  preprocessorVanillaExtract,
} from '../../../src/mediaQueries/libraryHelpers/vanilla-extract';
import type { StyleRule } from '../../../src/mediaQueries/types';
import { runMediaQueryTests } from './mediaQueries.shared';

runMediaQueryTests('src', {
  buildMediaQueryFromFeatures,
  buildMediaQueryString,
  createMediaQueryBuilder,
  emitCustomFeatures,
  emitDimensionsFeatures,
  emitResolutionFeatures,
  mediaQueryFactory,
  mDpi,
  mPx,
  r,
});

describe('mediaQueries (src) factory output mappers', () => {
  it('wraps output for vanilla-extract', () => {
    const factory = mediaQueryFactory({
      queries: {
        desktop: { minWidth: mPx(640) },
      },
      config: {
        label: 'vanilla-extract',
        errorHandling: {
          invalidValueMode: 'throw',
          lintingMode: 'log',
        },
        output: mediaQueryOutputVanillaExtract,
      },
    });

    const result = factory({
      desktop: { color: 'red' },
    });

    expect(result).toEqual({
      '&': {
        '@media': {
          'screen and (min-width: 640px)': { color: 'red' },
        },
      },
    });
  });

  it('supports preProcessor output for vanilla-extract', () => {
    const factory = mediaQueryFactory({
      queries: {
        compact: { maxWidth: mPx(640) },
      },
      config: {
        label: 'vanilla-extract-preprocessor',
        errorHandling: {
          invalidValueMode: 'throw',
          lintingMode: 'log',
        },
        preProcessor: preprocessorVanillaExtract,
        output: mediaQueryOutputVanillaExtract,
      },
    });

    const result = factory({
      compact: {
        color: 'red',
        selectors: {
          '&[data-x]': {
            color: 'blue',
          },
        },
      },
    });

    expect(result).toEqual({
      '&': {
        '@media': {
          'screen and (max-width: 640px)': { color: 'red' },
        },
      },
      '&[data-x]': {
        '@media': {
          'screen and (max-width: 640px)': { color: 'blue' },
        },
      },
    });
  });

  it('supports a custom output mapper', () => {
    const factory = mediaQueryFactory({
      queries: {
        desktop: { minWidth: mPx(640) },
      },
      config: {
        label: 'custom-output',
        errorHandling: {
          invalidValueMode: 'throw',
          lintingMode: 'log',
        },
        output: (media) => ({
          level1: {
            level2: media,
            extraCss: 'someValue',
          },
        }),
      },
    });

    const result = factory({
      desktop: { color: 'red' },
    });

    expect(result).toEqual({
      level1: {
        level2: {
          '@media': {
            'screen and (min-width: 640px)': { color: 'red' },
          },
        },
        extraCss: 'someValue',
      },
    });
  });

  it('runs preProcessor before output', () => {
    const factory = mediaQueryFactory({
      queries: {
        desktop: { minWidth: mPx(640) },
      },
      config: {
        label: 'pre-processor',
        errorHandling: {
          invalidValueMode: 'throw',
          lintingMode: 'log',
        },
        preProcessor: (media) => ({
          '@media': {
            'screen and (min-width: 640px)': { color: 'blue' },
          },
        }),
        output: (media) => ({
          wrapped: media,
        }),
      },
    });

    const result = factory({
      desktop: { color: 'red' },
    });

    expect(result).toEqual({
      wrapped: {
        '@media': {
          'screen and (min-width: 640px)': { color: 'blue' },
        },
      },
    });
  });

  it('flattens nested selectors recursively', () => {
    const media: StyleRule = {
      '@media': {
        'screen and (min-width: 640px)': {
          color: 'red',
          selectors: {
            '&[data-x]': {
              background: 'blue',
              selectors: {
                '&:hover': {
                  color: 'green',
                },
                '.child': {
                  color: 'purple',
                },
              },
            },
          },
        },
      },
    };

    const result = preprocessorVanillaExtract(media);

    expect(result).toEqual({
      '&': {
        '@media': {
          'screen and (min-width: 640px)': { color: 'red' },
        },
      },
      '&[data-x]': {
        '@media': {
          'screen and (min-width: 640px)': { background: 'blue' },
        },
      },
      '&[data-x]:hover': {
        '@media': {
          'screen and (min-width: 640px)': { color: 'green' },
        },
      },
      '&[data-x] .child': {
        '@media': {
          'screen and (min-width: 640px)': { color: 'purple' },
        },
      },
    });
  });
});

describe('mediaQueries (src) mixed-unit bounds', () => {
  it('accepts mixed-unit min/max width (valid CSS)', () => {
    expect(
      buildMediaQueryString({
        minWidth: mPx(320),
        maxWidth: mEm(60),
      }),
    ).toBe('screen and (min-width: 320px) and (max-width: 60em)');
  });

  it('accepts mixed-unit min/max resolution', () => {
    expect(
      buildMediaQueryString({
        minResolution: mDpi(96),
        maxResolution: mDppx(2),
      }),
    ).toBe(
      'screen and (min-resolution: 96dpi) and (max-resolution: 2dppx)',
    );
  });

  it('still enforces min <= max ordering when units match', () => {
    const factory = mediaQueryFactory({
      queries: { bad: { minWidth: mPx(1000), maxWidth: mPx(500) } },
      config: {
        label: 'ordering',
        errorHandling: { invalidValueMode: 'throw' },
      },
    });
    expect(() => factory({ bad: { color: 'red' } })).toThrow(
      'minWidth must be less than or equal to maxWidth',
    );
  });

  it('does not enforce ordering across units, even in throw mode', () => {
    const factory = mediaQueryFactory({
      queries: { ok: { minWidth: mPx(1000), maxWidth: mEm(10) } },
      config: {
        label: 'mixed',
        errorHandling: { invalidValueMode: 'throw' },
      },
    });
    expect(() => factory({ ok: { color: 'red' } })).not.toThrow();
  });
});
